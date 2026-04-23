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

export type PaymentSessionRecord = {
  id: string
  projectId: string
  provider: 'sandbox' | 'stripe'
  status: 'pending' | 'paid' | 'expired' | 'cancelled'
  amount: number
  currency: string
  checkoutUrl: string
  providerSessionId?: string | null
  reference: string
  createdAt: string
  updatedAt: string
  paidAt?: string | null
}

export type Database = {
  leads: LeadRecord[]
  customers: CustomerRecord[]
  projects: ProjectRecord[]
  approvals: ApprovalRecord[]
  actions: ActionRecord[]
  paymentSessions: PaymentSessionRecord[]
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
    paymentSessions: [],
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
    paymentSessions: parsed?.paymentSessions ?? [],
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
  return db
}

function createSchema(db: DatabaseSync) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS system_state (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      company TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS leads (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      company TEXT,
      offer_summary TEXT NOT NULL,
      target_audience TEXT NOT NULL,
      primary_goal TEXT NOT NULL,
      package_hint TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL,
      public_token TEXT NOT NULL,
      status TEXT NOT NULL,
      package_type TEXT,
      quoted_price INTEGER,
      paid_amount INTEGER NOT NULL,
      delivery_url TEXT,
      brief_offer_summary TEXT NOT NULL,
      brief_target_audience TEXT NOT NULL,
      brief_primary_goal TEXT NOT NULL,
      brief_package_hint TEXT,
      quote_json TEXT NOT NULL,
      draft_generated_at TEXT,
      draft_config_json TEXT,
      draft_html TEXT,
      payment_requested_at TEXT,
      payment_instructions TEXT,
      paid_at TEXT,
      pending_action_type TEXT,
      pending_action_requested_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS revisions (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      note TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS approvals (
      id TEXT PRIMARY KEY,
      project_id TEXT,
      action_type TEXT NOT NULL,
      reason TEXT NOT NULL,
      payload_json TEXT,
      status TEXT NOT NULL,
      resolver_note TEXT,
      created_at TEXT NOT NULL,
      resolved_at TEXT
    );

    CREATE TABLE IF NOT EXISTS actions (
      id TEXT PRIMARY KEY,
      project_id TEXT,
      type TEXT NOT NULL,
      risk_level TEXT NOT NULL,
      status TEXT NOT NULL,
      reason TEXT,
      input_json TEXT,
      output_json TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS payment_sessions (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      provider TEXT NOT NULL,
      status TEXT NOT NULL,
      amount INTEGER NOT NULL,
      currency TEXT NOT NULL,
      checkout_url TEXT NOT NULL,
      provider_session_id TEXT,
      reference TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      paid_at TEXT
    );
  `)
}

function tableExists(db: DatabaseSync, tableName: string) {
  const row = db.prepare(`SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?`).get(tableName) as { name: string } | undefined
  return Boolean(row)
}

function hasNormalizedData(db: DatabaseSync) {
  const tableChecks = [
    'customers',
    'leads',
    'projects',
    'revisions',
    'approvals',
    'actions',
    'payment_sessions',
  ]

  for (const tableName of tableChecks) {
    if (!tableExists(db, tableName)) {
      continue
    }

    const row = db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get() as { count: number }
    if (row.count > 0) {
      return true
    }
  }

  return false
}

function isInitialized(db: DatabaseSync) {
  const row = db.prepare("SELECT value FROM system_state WHERE key = 'normalized_initialized'").get() as { value: string } | undefined
  return row?.value === '1'
}

function markInitialized(db: DatabaseSync) {
  db.prepare("INSERT INTO system_state (key, value) VALUES ('normalized_initialized', '1') ON CONFLICT(key) DO UPDATE SET value = excluded.value").run()
}

function readLegacyAppState(db: DatabaseSync) {
  if (!tableExists(db, 'app_state')) {
    return null
  }

  const row = db.prepare('SELECT data FROM app_state WHERE id = 1').get() as { data: string } | undefined
  if (!row?.data) {
    return null
  }

  try {
    return normalizeDb(JSON.parse(row.data) as Partial<Database>)
  } catch {
    return null
  }
}

function writeNormalizedState(db: DatabaseSync, nextDb: Database) {
  const state = normalizeDb(nextDb)

  db.exec('BEGIN IMMEDIATE')
  try {
    db.exec(`
      DELETE FROM payment_sessions;
      DELETE FROM actions;
      DELETE FROM approvals;
      DELETE FROM revisions;
      DELETE FROM projects;
      DELETE FROM leads;
      DELETE FROM customers;
    `)

    const insertCustomer = db.prepare(
      'INSERT INTO customers (id, name, email, company, created_at) VALUES (?, ?, ?, ?, ?)',
    )
    for (const customer of state.customers) {
      insertCustomer.run(customer.id, customer.name, customer.email, customer.company ?? null, customer.createdAt)
    }

    const insertLead = db.prepare(
      'INSERT INTO leads (id, name, email, company, offer_summary, target_audience, primary_goal, package_hint, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    )
    for (const lead of state.leads) {
      insertLead.run(
        lead.id,
        lead.name,
        lead.email,
        lead.company ?? null,
        lead.offerSummary,
        lead.targetAudience,
        lead.primaryGoal,
        lead.packageHint ?? null,
        lead.createdAt,
      )
    }

    const insertProject = db.prepare(
      `INSERT INTO projects (
        id, customer_id, public_token, status, package_type, quoted_price, paid_amount, delivery_url,
        brief_offer_summary, brief_target_audience, brief_primary_goal, brief_package_hint,
        quote_json, draft_generated_at, draft_config_json, draft_html,
        payment_requested_at, payment_instructions, paid_at,
        pending_action_type, pending_action_requested_at,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    const insertRevision = db.prepare('INSERT INTO revisions (id, project_id, note, created_at) VALUES (?, ?, ?, ?)')

    for (const project of state.projects) {
      insertProject.run(
        project.id,
        project.customerId,
        project.publicToken,
        project.status,
        project.packageType ?? null,
        project.quotedPrice ?? null,
        project.paidAmount,
        project.deliveryUrl ?? null,
        project.memory.brief.offerSummary,
        project.memory.brief.targetAudience,
        project.memory.brief.primaryGoal,
        project.memory.brief.packageHint ?? null,
        JSON.stringify(project.memory.quote),
        project.memory.draft?.generatedAt ?? null,
        project.memory.draft ? JSON.stringify(project.memory.draft.config) : null,
        project.memory.draft?.html ?? null,
        project.memory.paymentRequestedAt ?? null,
        project.memory.paymentInstructions ?? null,
        project.memory.paidAt ?? null,
        project.memory.pendingAction?.type ?? null,
        project.memory.pendingAction?.requestedAt ?? null,
        project.createdAt,
        project.updatedAt,
      )

      for (const revision of project.memory.revisions) {
        insertRevision.run(revision.id, project.id, revision.note, revision.createdAt)
      }
    }

    const insertApproval = db.prepare(
      'INSERT INTO approvals (id, project_id, action_type, reason, payload_json, status, resolver_note, created_at, resolved_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    )
    for (const approval of state.approvals) {
      insertApproval.run(
        approval.id,
        approval.projectId ?? null,
        approval.actionType,
        approval.reason,
        approval.payload ? JSON.stringify(approval.payload) : null,
        approval.status,
        approval.resolverNote ?? null,
        approval.createdAt,
        approval.resolvedAt ?? null,
      )
    }

    const insertAction = db.prepare(
      'INSERT INTO actions (id, project_id, type, risk_level, status, reason, input_json, output_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    )
    for (const action of state.actions) {
      insertAction.run(
        action.id,
        action.projectId ?? null,
        action.type,
        action.riskLevel,
        action.status,
        action.reason ?? null,
        action.input === undefined ? null : JSON.stringify(action.input),
        action.output === undefined ? null : JSON.stringify(action.output),
        action.createdAt,
      )
    }

    const insertPaymentSession = db.prepare(
      'INSERT INTO payment_sessions (id, project_id, provider, status, amount, currency, checkout_url, provider_session_id, reference, created_at, updated_at, paid_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    )
    for (const session of state.paymentSessions) {
      insertPaymentSession.run(
        session.id,
        session.projectId,
        session.provider,
        session.status,
        session.amount,
        session.currency,
        session.checkoutUrl,
        session.providerSessionId ?? null,
        session.reference,
        session.createdAt,
        session.updatedAt,
        session.paidAt ?? null,
      )
    }

    db.exec('COMMIT')
  } catch (error) {
    try {
      db.exec('ROLLBACK')
    } catch {
      // ignore rollback failures
    }
    throw error
  }
}

function buildProjectMemory(row: Record<string, unknown>, revisions: RevisionRecord[]): ProjectMemory {
  const draftGeneratedAt = typeof row.draft_generated_at === 'string' ? row.draft_generated_at : null
  const draftConfigJson = typeof row.draft_config_json === 'string' ? row.draft_config_json : null
  const draftHtml = typeof row.draft_html === 'string' ? row.draft_html : null

  return {
    brief: {
      offerSummary: String(row.brief_offer_summary ?? ''),
      targetAudience: String(row.brief_target_audience ?? ''),
      primaryGoal: String(row.brief_primary_goal ?? ''),
      packageHint: typeof row.brief_package_hint === 'string' ? row.brief_package_hint : null,
    },
    quote: JSON.parse(String(row.quote_json ?? '{}')) as QuoteRecord,
    draft:
      draftGeneratedAt && draftConfigJson && draftHtml
        ? {
            generatedAt: draftGeneratedAt,
            config: JSON.parse(draftConfigJson) as DraftRecord['config'],
            html: draftHtml,
          }
        : null,
    revisions,
    paymentRequestedAt: typeof row.payment_requested_at === 'string' ? row.payment_requested_at : undefined,
    paymentInstructions: typeof row.payment_instructions === 'string' ? row.payment_instructions : undefined,
    paidAt: typeof row.paid_at === 'string' ? row.paid_at : undefined,
    pendingAction:
      typeof row.pending_action_type === 'string' && typeof row.pending_action_requested_at === 'string'
        ? { type: row.pending_action_type as PendingAction['type'], requestedAt: row.pending_action_requested_at }
        : null,
  }
}

async function ensureDatabaseReady() {
  const databasePath = getDatabasePath()
  await mkdir(path.dirname(databasePath), { recursive: true })

  const db = openDatabase()
  try {
    createSchema(db)
    if (!isInitialized(db)) {
      if (hasNormalizedData(db)) {
        markInitialized(db)
      } else {
        const initialState = readLegacyAppState(db) ?? (await readLegacyJsonSnapshot()) ?? cloneDefaultDb()
        writeNormalizedState(db, initialState)
        markInitialized(db)
      }
    }
  } finally {
    db.close()
  }
}

export async function readDb(): Promise<Database> {
  await ensureDatabaseReady()

  const db = openDatabase()
  try {
    createSchema(db)

    const leads = db
      .prepare('SELECT id, name, email, company, offer_summary, target_audience, primary_goal, package_hint, created_at FROM leads ORDER BY created_at ASC')
      .all()
      .map((row) => ({
        id: String(row.id),
        name: String(row.name),
        email: String(row.email),
        company: typeof row.company === 'string' ? row.company : null,
        offerSummary: String(row.offer_summary),
        targetAudience: String(row.target_audience),
        primaryGoal: String(row.primary_goal),
        packageHint: typeof row.package_hint === 'string' ? row.package_hint : null,
        createdAt: String(row.created_at),
      })) satisfies LeadRecord[]

    const customers = db
      .prepare('SELECT id, name, email, company, created_at FROM customers ORDER BY created_at ASC')
      .all()
      .map((row) => ({
        id: String(row.id),
        name: String(row.name),
        email: String(row.email),
        company: typeof row.company === 'string' ? row.company : null,
        createdAt: String(row.created_at),
      })) satisfies CustomerRecord[]

    const revisionsByProject = new Map<string, RevisionRecord[]>()
    for (const row of db.prepare('SELECT id, project_id, note, created_at FROM revisions ORDER BY created_at ASC').all()) {
      const projectId = String(row.project_id)
      const revisions = revisionsByProject.get(projectId) ?? []
      revisions.push({ id: String(row.id), note: String(row.note), createdAt: String(row.created_at) })
      revisionsByProject.set(projectId, revisions)
    }

    const projects = db
      .prepare(
        `SELECT id, customer_id, public_token, status, package_type, quoted_price, paid_amount, delivery_url,
          brief_offer_summary, brief_target_audience, brief_primary_goal, brief_package_hint,
          quote_json, draft_generated_at, draft_config_json, draft_html,
          payment_requested_at, payment_instructions, paid_at,
          pending_action_type, pending_action_requested_at,
          created_at, updated_at
        FROM projects ORDER BY created_at ASC`,
      )
      .all()
      .map((row) => ({
        id: String(row.id),
        customerId: String(row.customer_id),
        publicToken: String(row.public_token),
        status: String(row.status) as ProjectRecord['status'],
        packageType: typeof row.package_type === 'string' ? (row.package_type as PackageType) : null,
        quotedPrice: typeof row.quoted_price === 'number' ? row.quoted_price : null,
        paidAmount: typeof row.paid_amount === 'number' ? row.paid_amount : 0,
        deliveryUrl: typeof row.delivery_url === 'string' ? row.delivery_url : null,
        createdAt: String(row.created_at),
        updatedAt: String(row.updated_at),
        memory: buildProjectMemory(row, revisionsByProject.get(String(row.id)) ?? []),
      })) satisfies ProjectRecord[]

    const approvals = db
      .prepare('SELECT id, project_id, action_type, reason, payload_json, status, resolver_note, created_at, resolved_at FROM approvals ORDER BY created_at ASC')
      .all()
      .map((row) => ({
        id: String(row.id),
        projectId: typeof row.project_id === 'string' ? row.project_id : null,
        actionType: String(row.action_type),
        reason: String(row.reason),
        payload: typeof row.payload_json === 'string' ? (JSON.parse(row.payload_json) as Record<string, unknown>) : null,
        status: String(row.status) as ApprovalRecord['status'],
        resolverNote: typeof row.resolver_note === 'string' ? row.resolver_note : null,
        createdAt: String(row.created_at),
        resolvedAt: typeof row.resolved_at === 'string' ? row.resolved_at : null,
      })) satisfies ApprovalRecord[]

    const actions = db
      .prepare('SELECT id, project_id, type, risk_level, status, reason, input_json, output_json, created_at FROM actions ORDER BY created_at ASC')
      .all()
      .map((row) => ({
        id: String(row.id),
        projectId: typeof row.project_id === 'string' ? row.project_id : null,
        type: String(row.type),
        riskLevel: String(row.risk_level) as ActionRecord['riskLevel'],
        status: String(row.status) as ActionRecord['status'],
        reason: typeof row.reason === 'string' ? row.reason : null,
        input: typeof row.input_json === 'string' ? JSON.parse(row.input_json) : undefined,
        output: typeof row.output_json === 'string' ? JSON.parse(row.output_json) : undefined,
        createdAt: String(row.created_at),
      })) satisfies ActionRecord[]

    const paymentSessions = db
      .prepare('SELECT id, project_id, provider, status, amount, currency, checkout_url, provider_session_id, reference, created_at, updated_at, paid_at FROM payment_sessions ORDER BY created_at ASC')
      .all()
      .map((row) => ({
        id: String(row.id),
        projectId: String(row.project_id),
        provider: String(row.provider) as PaymentSessionRecord['provider'],
        status: String(row.status) as PaymentSessionRecord['status'],
        amount: typeof row.amount === 'number' ? row.amount : Number(row.amount ?? 0),
        currency: String(row.currency),
        checkoutUrl: String(row.checkout_url),
        providerSessionId: typeof row.provider_session_id === 'string' ? row.provider_session_id : null,
        reference: String(row.reference),
        createdAt: String(row.created_at),
        updatedAt: String(row.updated_at),
        paidAt: typeof row.paid_at === 'string' ? row.paid_at : null,
      })) satisfies PaymentSessionRecord[]

    return { leads, customers, projects, approvals, actions, paymentSessions }
  } finally {
    db.close()
  }
}

export async function writeDb(nextDb: Database) {
  await ensureDatabaseReady()

  const db = openDatabase()
  try {
    createSchema(db)
    writeNormalizedState(db, nextDb)
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
  const paymentSessions = db.paymentSessions
    .filter((entry) => entry.projectId === projectId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  return {
    ...hydratedProject,
    customer,
    approvals,
    actions,
    paymentSessions,
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

export async function getPaymentSessionById(paymentSessionId: string) {
  const db = await readDb()
  return db.paymentSessions.find((entry) => entry.id === paymentSessionId) ?? null
}

export async function getPaymentSessionByProviderSessionId(providerSessionId: string) {
  const db = await readDb()
  return db.paymentSessions.find((entry) => entry.providerSessionId === providerSessionId) ?? null
}

export async function resetDb() {
  await writeDb(cloneDefaultDb())
}
