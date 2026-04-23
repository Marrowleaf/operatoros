import test from 'node:test'
import assert from 'node:assert/strict'

import { createProjectFromBrief } from '../src/lib/project-intake'
import { getProjectById, resetDb } from '../src/lib/store'
import { markProjectPaid, requestDelivery, requestPayment, requestRevision } from '../src/lib/workflows'

test('createProjectFromBrief persists a quoted project with a draft', async () => {
  await resetDb()

  const result = await createProjectFromBrief({
    name: 'James',
    email: 'james@example.com',
    company: 'OperatorOS',
    brief: {
      offerSummary: 'AI operator for founder landing pages',
      targetAudience: 'startup founders',
      primaryGoal: 'Book a call',
      packageHint: 'starter',
    },
  })

  assert.equal(result.quote.status, 'ok')
  const project = await getProjectById(result.project.id)
  assert.ok(project)
  assert.equal(project?.status, 'quoted')
  assert.ok(project?.memory.draft)
  assert.equal(project?.memory.draft?.config.cta, 'Book a call')
})

test('project cannot be delivered before payment, then requires approval after payment for pro work', async () => {
  await resetDb()

  const result = await createProjectFromBrief({
    name: 'James',
    email: 'james-pro@example.com',
    company: 'OperatorOS',
    brief: {
      offerSummary: 'Multi-page SaaS startup lead generation dashboard redesign',
      targetAudience: 'startup founders',
      primaryGoal: 'Book a demo',
      packageHint: 'pro',
    },
  })

  await assert.rejects(() => requestDelivery(result.project.id), /marked paid before delivery/)

  await markProjectPaid(result.project.id)
  const delivery = await requestDelivery(result.project.id)

  assert.equal(delivery.status, 'approval_required')
})

test('escalated projects cannot be marked paid or delivered', async () => {
  await resetDb()

  const result = await createProjectFromBrief({
    name: 'James',
    email: 'james-escalated@example.com',
    company: 'OperatorOS',
    brief: {
      offerSummary: 'short',
      targetAudience: 'abc',
      primaryGoal: 'xyz',
      packageHint: '',
    },
  })

  assert.equal(result.quote.status, 'escalate')
  await assert.rejects(() => requestPayment(result.project.id), /accepted quote before fulfillment actions/)
  await assert.rejects(() => requestRevision(result.project.id, 'Anything'), /accepted quote before fulfillment actions/)
  await assert.rejects(() => markProjectPaid(result.project.id), /accepted quote before fulfillment actions/)
  await assert.rejects(() => requestDelivery(result.project.id), /accepted quote before fulfillment actions/)
})
