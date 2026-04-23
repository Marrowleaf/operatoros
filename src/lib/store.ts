import { mkdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { DatabaseSync } from 'node:sqlite'

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

const DEFAULT_JSON_PATH = path.join(process.cwd(), 'data', 'operatoros-db.json')
const DEFAULT_SQLITE_PATH = path.join(process.cwd(), 'data', 'operatoros.db')
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

function cloneDefaultDb(): Database {
  return {
    leads: [],
    customers: [],
    projects: [],
    approvals: [],
    actions: [],
  }
}

function resolveConfiguredPath(configuredPath: string) {
  return path.isAbsolute(configuredPath) ? configuredPath : path.join(process.cwd(), configuredPath)
}

function getLegacyJsonPath() {
  const configuredPath = process.env.OPERATOROS_DATA_PATH?.trim()
  if (!configuredPath) {
    return DEFAULT_JSON_PATH
  }

  const resolvedPath = resolveConfiguredPath(configuredPath)
  return resolvedPath.endsWith('.json') ? resolvedPath : null
}

export function getDatabasePath() {
  const configuredPath = process.env.OPERATOROS_DATABASE_PATH?.trim()
  if (configuredPath) {
    return resolveConfiguredPath(configuredPath)
  }

  const legacyJsonPath = getLegacyJsonPath()
  if (legacyJsonPath) {
    return legacyJsonPath.replace(/\.json$/i, '.sqlite')
  }

  const fallbackPath = process.env.OPERATOROS_DATA_PATH?.trim()
  return fallbackPath ? resolveConfiguredPath(fallbackPath) : DEFAULT_SQLITE_PATH
}

function normalizeDb(parsed: Partial<Database> | null | undefined): Database {
  return {
    leads: parsed?.leads ?? [],
    customers: parsed?.customers ?? [],
    projects: parsed?.projects ?? [],
    approvals: parsed?.approvals ?? [],
    actions: parsed?.actions ?? [],
  }
}

async function readLegacyJsonSnapshot() {
  const legacyJsonPath = getLegacyJsonPath()
  if (!legacyJsonPath) {
    return null
  }

  try {
    const raw = await readFile(legacyJsonPath, 'utf8')
    return normalizeDb(JSON.parse(raw) as Partial<Database>)
  } catch {
    return null
  }
}

function openDatabase() {
  const db = new DatabaseSync(getDatabasePath())
  db.exec('PRAGMA journal_mode = WAL;')
  db.exec('PRAGMA busy_timeout = 5000;')
  db.exec(`
    CREATE TABLE IF NOT EXISTS app_state (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      data TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `)
  return db
}

async function ensureDatabaseReady() {
  const databasePath = getDatabasePath()
  await mkdir(path.dirname(databasePath), { recursive: true })

  const db = openDatabase()
  try {
    const row = db.prepare('SELECT data FROM app_state WHERE id = 1').get() as { data: string } | undefined
    if (!row) {
      const initialState = (await readLegacyJsonSnapshot()) ?? cloneDefaultDb()
      db.prepare('INSERT INTO app_state (id, data, updated_at) VALUES (1, ?, ?)').run(JSON.stringify(initialState), nowIso())
    }
  } finally {
    db.close()
  }
}

export async function readDb(): Promise<Database> {
  await ensureDatabaseReady()

  const db = openDatabase()
  try {
    const row = db.prepare('SELECT data FROM app_state WHERE id = 1').get() as { data: string } | undefined
    return normalizeDb(row ? (JSON.parse(row.data) as Partial<Database>) : cloneDefaultDb())
  } finally {
    db.close()
  }
}

export async function writeDb(nextDb: Database) {
  await ensureDatabaseReady()

  const db = openDatabase()
  try {
    db.exec('BEGIN IMMEDIATE')
    db.prepare('UPDATE app_state SET data = ?, updated_at = ? WHERE id = 1').run(JSON.stringify(normalizeDb(nextDb)), nowIso())
    db.exec('COMMIT')
  } catch (error) {
    try {
      db.exec('ROLLBACK')
    } catch {
      // ignore rollback failures
    }
    throw error
  } finally {
    db.close()
  }
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
  await writeDb(cloneDefaultDb())
}
