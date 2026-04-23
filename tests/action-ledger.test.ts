import test from 'node:test'
import assert from 'node:assert/strict'

import { createProjectFromBrief } from '../src/lib/project-intake'
import { getActionsForProject, resetDb } from '../src/lib/store'
import { requestRevision } from '../src/lib/workflows'

test('critical workflow actions are recorded to the ledger', async () => {
  await resetDb()

  const result = await createProjectFromBrief({
    name: 'James',
    email: 'james@example.com',
    brief: {
      offerSummary: 'Conversion-focused landing page service',
      targetAudience: 'bootstrapped founders',
      primaryGoal: 'Start the project',
      packageHint: 'starter',
    },
  })

  await requestRevision(result.project.id, 'Make the promise clearer for SaaS founders')

  const actions = await getActionsForProject(result.project.id)
  const actionTypes = actions.map((action) => action.type)

  assert.deepEqual(actionTypes, ['lead_received', 'quote_generated', 'draft_generated', 'revision_requested', 'draft_generated'])
})
