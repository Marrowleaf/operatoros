import { recordAction } from '@/src/lib/action-ledger'
import { buildLandingPageConfig, renderLandingPageHtml } from '@/src/lib/page-generator'
import { PACKAGES } from '@/src/policies/packages'
import { evaluateRisk } from '@/src/policies/risk-evaluator'
import { createId, getProjectById, nowIso, updateDb } from '@/src/lib/store'

function requireProject<T>(project: T | null, projectId: string): T {
  if (!project) {
    throw new Error(`Project ${projectId} not found`)
  }

  return project
}

function ensureProjectIsDeliverable(project: {
  status: string
  paidAmount: number
  quotedPrice?: number | null
  memory: { quote: { status: string }; draft: unknown | null }
}) {
  if (project.memory.quote.status !== 'ok') {
    throw new Error('Project must have an accepted quote before fulfillment actions')
  }

  if (!project.memory.draft) {
    throw new Error('Project must have a generated draft before fulfillment actions')
  }
}

function ensureProjectCanBeDelivered(project: {
  status: string
  paidAmount: number
  quotedPrice?: number | null
  memory: { quote: { status: string }; draft: unknown | null }
}) {
  ensureProjectIsDeliverable(project)

  const expectedAmount = project.quotedPrice ?? 0
  const hasRequiredPayment = expectedAmount <= 0 || project.paidAmount >= expectedAmount
  const statusAllowsDelivery = project.status === 'in_progress' || project.status === 'in_revision'

  if (!hasRequiredPayment) {
    throw new Error('Project must be marked paid before delivery')
  }

  if (!statusAllowsDelivery) {
    throw new Error('Project is not in a deliverable state')
  }
}

export async function requestPayment(projectId: string) {
  const current = requireProject(await getProjectById(projectId), projectId)
  ensureProjectIsDeliverable(current)

  const timestamp = nowIso()

  const project = await updateDb((db) => {
    const entry = db.projects.find((item) => item.id === projectId)
    if (!entry) throw new Error('Project not found')

    entry.status = 'awaiting_payment'
    entry.updatedAt = timestamp
    entry.memory.paymentRequestedAt = timestamp
    entry.memory.paymentInstructions = `Reply to this project with confirmation after paying the quoted amount. Reference: ${projectId.slice(0, 8).toUpperCase()}.`
    return entry
  })

  await recordAction({
    projectId,
    type: 'payment_requested',
    output: { instructions: project.memory.paymentInstructions },
  })

  return project
}

export async function markProjectPaid(projectId: string) {
  const current = requireProject(await getProjectById(projectId), projectId)
  ensureProjectIsDeliverable(current)

  const timestamp = nowIso()

  const project = await updateDb((db) => {
    const entry = db.projects.find((item) => item.id === projectId)
    if (!entry) throw new Error('Project not found')

    entry.status = 'in_progress'
    entry.paidAmount = entry.quotedPrice ?? entry.paidAmount
    entry.updatedAt = timestamp
    entry.memory.paidAt = timestamp
    return entry
  })

  await recordAction({
    projectId,
    type: 'payment_confirmed',
    output: { paidAmount: project.paidAmount },
  })

  return project
}

export async function regenerateDraft(projectId: string, revisionNote?: string) {
  const current = requireProject(await getProjectById(projectId), projectId)
  ensureProjectIsDeliverable(current)

  const timestamp = nowIso()

  const project = await updateDb((db) => {
    const entry = db.projects.find((item) => item.id === projectId)
    if (!entry) throw new Error('Project not found')

    const brief = entry.memory.brief
    const packageLabel = entry.packageType ? PACKAGES[entry.packageType].label : null
    const config = buildLandingPageConfig({
      offerSummary: brief.offerSummary,
      targetAudience: brief.targetAudience,
      primaryGoal: brief.primaryGoal,
      packageLabel,
      revisionNote: revisionNote ?? null,
    })

    entry.memory.draft = {
      generatedAt: timestamp,
      config,
      html: renderLandingPageHtml(config),
    }
    entry.updatedAt = timestamp
    entry.deliveryUrl = `/preview/${entry.id}`
    return entry
  })

  await recordAction({
    projectId,
    type: 'draft_generated',
    input: revisionNote ? { revisionNote } : undefined,
    output: { deliveryUrl: `/preview/${projectId}` },
  })

  return project
}

export async function requestRevision(projectId: string, note: string) {
  if (!note.trim()) {
    throw new Error('Revision note is required')
  }

  const current = requireProject(await getProjectById(projectId), projectId)
  ensureProjectIsDeliverable(current)

  const timestamp = nowIso()

  await updateDb((db) => {
    const entry = db.projects.find((item) => item.id === projectId)
    if (!entry) throw new Error('Project not found')

    entry.status = 'in_revision'
    entry.updatedAt = timestamp
    entry.memory.revisions.push({
      id: createId(),
      note: note.trim(),
      createdAt: timestamp,
    })
    return entry
  })

  await recordAction({
    projectId,
    type: 'revision_requested',
    status: 'pending',
    input: { note: note.trim() },
  })

  const regenerated = await regenerateDraft(projectId, note.trim())

  await updateDb((db) => {
    const entry = db.projects.find((item) => item.id === projectId)
    if (!entry) throw new Error('Project not found')
    entry.status = 'in_progress'
    entry.updatedAt = nowIso()
    return entry
  })

  return regenerated
}

export async function requestDelivery(projectId: string) {
  const current = requireProject(await getProjectById(projectId), projectId)
  ensureProjectCanBeDelivered(current)

  const assessment = evaluateRisk('deliver_project', {
    quotedPrice: current.quotedPrice ?? 0,
    packageType: current.packageType ?? '',
  })

  if (assessment.requiresApproval) {
    const existingPending = current.approvals.find(
      (approval) => approval.actionType === 'deliver_project' && approval.status === 'pending',
    )

    if (existingPending) {
      return { status: 'approval_required' as const, approval: existingPending }
    }

    const timestamp = nowIso()
    const approval = await updateDb((db) => {
      const entry = db.projects.find((item) => item.id === projectId)
      if (!entry) throw new Error('Project not found')

      entry.memory.pendingAction = {
        type: 'deliver_project',
        requestedAt: timestamp,
      }
      entry.updatedAt = timestamp

      const pending = {
        id: createId(),
        projectId,
        actionType: 'deliver_project',
        reason: assessment.reason ?? 'Approval required',
        payload: {
          quotedPrice: entry.quotedPrice,
          packageType: entry.packageType,
        },
        status: 'pending' as const,
        resolverNote: null,
        createdAt: timestamp,
        resolvedAt: null,
      }

      db.approvals.push(pending)
      return pending
    })

    await recordAction({
      projectId,
      type: 'approval_requested',
      riskLevel: 'high',
      status: 'pending',
      reason: approval.reason,
      output: { approvalId: approval.id },
    })

    return { status: 'approval_required' as const, approval }
  }

  const delivered = await deliverProject(projectId)
  return { status: 'delivered' as const, project: delivered }
}

export async function deliverProject(projectId: string) {
  const current = requireProject(await getProjectById(projectId), projectId)
  ensureProjectCanBeDelivered(current)

  const timestamp = nowIso()

  const project = await updateDb((db) => {
    const entry = db.projects.find((item) => item.id === projectId)
    if (!entry) throw new Error('Project not found')

    entry.status = 'delivered'
    entry.updatedAt = timestamp
    entry.deliveryUrl = `/preview/${entry.id}`
    entry.memory.pendingAction = null
    return entry
  })

  await recordAction({
    projectId,
    type: 'project_delivered',
    output: { deliveryUrl: `/preview/${projectId}` },
  })

  return project
}

export async function resolveApproval(input: { approvalId: string; status: 'approved' | 'rejected'; resolverNote?: string | null }) {
  const timestamp = nowIso()

  const approval = await updateDb((db) => {
    const entry = db.approvals.find((item) => item.id === input.approvalId)
    if (!entry) throw new Error('Approval not found')

    entry.status = input.status
    entry.resolverNote = input.resolverNote ?? null
    entry.resolvedAt = timestamp

    const project = entry.projectId ? db.projects.find((item) => item.id === entry.projectId) : null
    if (project && input.status === 'rejected') {
      project.memory.pendingAction = null
      project.updatedAt = timestamp
    }

    return entry
  })

  await recordAction({
    projectId: approval.projectId ?? undefined,
    type: 'approval_resolved',
    riskLevel: 'high',
    output: { approvalId: approval.id, status: approval.status },
  })

  if (approval.status === 'approved' && approval.projectId && approval.actionType === 'deliver_project') {
    await deliverProject(approval.projectId)
  }

  return requireProject(await getProjectById(approval.projectId ?? ''), approval.projectId ?? '')
}
