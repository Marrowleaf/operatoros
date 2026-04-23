import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import path from 'node:path'
import type { PackageType } from '@/src/policies/packages'

export type QuoteRecord =
  | { status: 'ok'; packageType: PackageType; price: number; reason: string }
  | { status: 'escalate'; reason: string }

export type RevisionRecord = {
  id: string
  note: string
  createdAt: string
}

export type DraftRecord = {
  generatedAt: string
  config: {
    eyebrow: string
    headline: string
    subheadline: string
    cta: string
    sections: Array<{ title: string; body: string }>
  }
  html: string
}

export type LeadRecord = {
  id: string
  name: string
  email: string
  company?: string | null
  offerSummary: string
  targetAudience: string
  primaryGoal: string
  packageHint?: string | null
  createdAt: string
}

export type CustomerRecord = {
  id: string
  name: string
  email: string
  company?: string | null
  createdAt: string
}

export type PendingAction = {
  type: 'deliver_project'
  requestedAt: string
}

export type ProjectMemory = {
  brief: {
    offerSummary: string
    targetAudience: string
    primaryGoal: string
    packageHint?: string | null
  }
  quote: QuoteRecord
  draft: DraftRecord | null
  revisions: RevisionRecord[]
  paymentRequestedAt?: string
  paymentInstructions?: string
  paidAt?: string
  pendingAction?: PendingAction | null
}

export type ProjectRecord = {
  id: string
  customerId: string
  publicToken: string
  status: 'lead' | 'quoted' | 'awaiting_payment' | 'in_progress' | 'in_revision' | 'delivered' | 'paused' | 'escalated'
  packageType?: PackageType | null
  quotedPrice?: number | null
  paidAmount: number
  deliveryUrl?: string | null
  createdAt: string
  updatedAt: string
  memory: ProjectMemory
}

export type ApprovalRecord = {
  id: string
  projectId?: string | null
  actionType: string
  reason: string
  payload?: Record<string, unknown> | null
  status: 'pending' | 'approved' | 'rejected'
  resolverNote?: string | null
  createdAt: string
  resolvedAt?: string | null
}

export type ActionRecord = {
  id: string
  projectId?: string | null
  type: string
  riskLevel: 'low' | 'medium' | 'high'
  status: 'success' | 'blocked' | 'pending' | 'failed'
  reason?: string | null
  input?: unknown
  output?: unknown
  createdAt: string
}

export type Database = {
  leads: LeadRecord[]
  customers: CustomerRecord[]
  projects: ProjectRecord[]
  approvals: ApprovalRecord[]
  actions: ActionRecord[]
}

const DEFAULT_DB: Database = {
  leads: [],
  customers: [],
  projects: [],
  approvals: [],
  actions: [],
}

const configuredPath = process.env.OPERATOROS_DATA_PATH?.trim()
const DB_PATH = configuredPath
  ? path.isAbsolute(configuredPath)
    ? configuredPath
    : path.join(process.cwd(), configuredPath)
  : path.join(process.cwd(), 'data', 'operatoros-db.json')
const DATA_DIR = path.dirname(DB_PATH)
let writeQueue: Promise<unknown> = Promise.resolve()

export function nowIso() {
  return new Date().toISOString()
}

export function createId() {
  return crypto.randomUUID()
}

export function createPublicToken() {
  return crypto.randomUUID().replace(/-/g, '')
}

async function ensureDbFile() {
  await mkdir(DATA_DIR, { recursive: true })
  try {
    await readFile(DB_PATH, 'utf8')
  } catch {
    await writeFile(DB_PATH, JSON.stringify(DEFAULT_DB, null, 2), 'utf8')
  }
}

export async function readDb(): Promise<Database> {
  await ensureDbFile()
  const raw = await readFile(DB_PATH, 'utf8')
  const parsed = JSON.parse(raw) as Partial<Database>

  return {
    leads: parsed.leads ?? [],
    customers: parsed.customers ?? [],
    projects: parsed.projects ?? [],
    approvals: parsed.approvals ?? [],
    actions: parsed.actions ?? [],
  }
}

export async function writeDb(db: Database) {
  await ensureDbFile()
  const tmpPath = `${DB_PATH}.tmp`
  await writeFile(tmpPath, JSON.stringify(db, null, 2), 'utf8')
  await rename(tmpPath, DB_PATH)
}

export async function updateDb<T>(updater: (db: Database) => T | Promise<T>): Promise<T> {
  const run = writeQueue.catch(() => undefined).then(async () => {
    const db = await readDb()
    const result = await updater(db)
    await writeDb(db)
    return result
  })

  writeQueue = run.then(() => undefined, () => undefined)
  return run
}

export async function getProjects() {
  const db = await readDb()
  let mutated = false

  const projects = db.projects
    .map((project) => {
      const publicToken = project.publicToken ?? createPublicToken()
      if (publicToken !== project.publicToken) {
        project.publicToken = publicToken
        mutated = true
      }

      return {
        ...project,
        publicToken,
        customer: db.customers.find((customer) => customer.id === project.customerId) ?? null,
      }
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  if (mutated) {
    await writeDb(db)
  }

  return projects
}

export async function getProjectById(projectId: string) {
  const db = await readDb()
  const project = db.projects.find((entry) => entry.id === projectId)

  if (!project) {
    return null
  }

  const hydratedProject = {
    ...project,
    publicToken: project.publicToken ?? createPublicToken(),
  }
  if (hydratedProject.publicToken !== project.publicToken) {
    project.publicToken = hydratedProject.publicToken
    await writeDb(db)
  }

  const customer = db.customers.find((entry) => entry.id === hydratedProject.customerId) ?? null
  const approvals = db.approvals
    .filter((entry) => entry.projectId === projectId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const actions = db.actions
    .filter((entry) => entry.projectId === projectId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))

  return {
    ...hydratedProject,
    customer,
    approvals,
    actions,
  }
}

export async function getPublicProjectById(projectId: string, token: string) {
  const project = await getProjectById(projectId)

  if (!project || !token || project.publicToken !== token) {
    return null
  }

  return project
}

export async function getApprovals(status: ApprovalRecord['status'] | 'all' = 'pending') {
  const db = await readDb()
  return db.approvals
    .filter((entry) => status === 'all' || entry.status === status)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function getActionsForProject(projectId: string) {
  const db = await readDb()
  return db.actions
    .filter((entry) => entry.projectId === projectId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

export async function resetDb() {
  await writeDb({ ...DEFAULT_DB })
}

export { DB_PATH }
