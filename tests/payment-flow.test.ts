import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { createProjectFromBrief } from '../src/lib/project-intake'
import { createCheckoutSessionForProject, getPaymentSessionById, markPaymentSessionPaid } from '../src/lib/payments'
import { getProjectById, resetDb } from '../src/lib/store'
import { POST as createPaymentLink } from '../app/api/payments/create-link/route'

async function withTempSqlitePath(run: () => Promise<void>) {
  const tempDir = await mkdtemp(path.join(tmpdir(), 'operatoros-payment-test-'))
  const sqlitePath = path.join(tempDir, 'operatoros-test.sqlite')
  const previousDatabasePath = process.env.OPERATOROS_DATABASE_PATH
  const previousDataPath = process.env.OPERATOROS_DATA_PATH
  const previousBaseUrl = process.env.OPERATOROS_BASE_URL
  const previousStripeKey = process.env.STRIPE_SECRET_KEY
  const previousSandboxFlag = process.env.OPERATOROS_ALLOW_SANDBOX_PAYMENTS

  process.env.OPERATOROS_DATABASE_PATH = sqlitePath
  delete process.env.OPERATOROS_DATA_PATH
  process.env.OPERATOROS_BASE_URL = 'https://operatoros.test'
  delete process.env.STRIPE_SECRET_KEY
  process.env.OPERATOROS_ALLOW_SANDBOX_PAYMENTS = '1'

  try {
    await run()
  } finally {
    if (previousDatabasePath === undefined) {
      delete process.env.OPERATOROS_DATABASE_PATH
    } else {
      process.env.OPERATOROS_DATABASE_PATH = previousDatabasePath
    }

    if (previousDataPath === undefined) {
      delete process.env.OPERATOROS_DATA_PATH
    } else {
      process.env.OPERATOROS_DATA_PATH = previousDataPath
    }

    if (previousBaseUrl === undefined) {
      delete process.env.OPERATOROS_BASE_URL
    } else {
      process.env.OPERATOROS_BASE_URL = previousBaseUrl
    }

    if (previousStripeKey === undefined) {
      delete process.env.STRIPE_SECRET_KEY
    } else {
      process.env.STRIPE_SECRET_KEY = previousStripeKey
    }

    if (previousSandboxFlag === undefined) {
      delete process.env.OPERATOROS_ALLOW_SANDBOX_PAYMENTS
    } else {
      process.env.OPERATOROS_ALLOW_SANDBOX_PAYMENTS = previousSandboxFlag
    }

    await rm(tempDir, { recursive: true, force: true })
  }
}

test('creates a checkout session and marks a project paid when the session is completed', async () => {
  await withTempSqlitePath(async () => {
    await resetDb()

    const result = await createProjectFromBrief({
      name: 'James',
      email: 'pay@example.com',
      company: 'OperatorOS',
      brief: {
        offerSummary: 'Autonomous operator landing page',
        targetAudience: 'startup founders',
        primaryGoal: 'Book a call',
        packageHint: 'starter',
      },
    })

    const session = await createCheckoutSessionForProject({
      projectId: result.project.id,
      publicToken: result.project.publicToken,
    })

    assert.equal(session.provider, 'sandbox')
    assert.match(session.checkoutUrl, new RegExp(`/checkout/${session.id}`))

    const beforePayment = await getProjectById(result.project.id)
    assert.equal(beforePayment?.status, 'awaiting_payment')

    await markPaymentSessionPaid(session.id)

    const storedSession = await getPaymentSessionById(session.id)
    const paidProject = await getProjectById(result.project.id)

    assert.equal(storedSession?.status, 'paid')
    assert.equal(paidProject?.status, 'in_progress')
    assert.equal(paidProject?.paidAmount, result.project.quotedPrice)
  })
})

test('payment link endpoint rejects requests without a valid public token', async () => {
  await withTempSqlitePath(async () => {
    await resetDb()

    const result = await createProjectFromBrief({
      name: 'James',
      email: 'pay-no-token@example.com',
      company: 'OperatorOS',
      brief: {
        offerSummary: 'AI operator landing page studio',
        targetAudience: 'startup founders',
        primaryGoal: 'Book a call',
        packageHint: 'starter',
      },
    })

    const response = await createPaymentLink(
      new Request('https://operatoros.test/api/payments/create-link', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ projectId: result.project.id }),
      }),
    )

    assert.equal(response.status, 401)
  })
})

test('cancelled payment sessions cannot later be marked paid', async () => {
  await withTempSqlitePath(async () => {
    await resetDb()

    const result = await createProjectFromBrief({
      name: 'James',
      email: 'pay-repeat@example.com',
      company: 'OperatorOS',
      brief: {
        offerSummary: 'Repeatable checkout test',
        targetAudience: 'startup founders',
        primaryGoal: 'Book a call',
        packageHint: 'starter',
      },
    })

    const first = await createCheckoutSessionForProject({
      projectId: result.project.id,
      publicToken: result.project.publicToken,
    })
    const second = await createCheckoutSessionForProject({
      projectId: result.project.id,
      publicToken: result.project.publicToken,
    })

    assert.notEqual(first.id, second.id)
    await assert.rejects(() => markPaymentSessionPaid(first.id), /Payment session is not payable/)

    const refreshedFirst = await getPaymentSessionById(first.id)
    const refreshedSecond = await getPaymentSessionById(second.id)
    assert.equal(refreshedFirst?.status, 'cancelled')
    assert.equal(refreshedSecond?.status, 'pending')
  })
})

test('already-paid projects cannot create another checkout session', async () => {
  await withTempSqlitePath(async () => {
    await resetDb()

    const result = await createProjectFromBrief({
      name: 'James',
      email: 'pay-repeat-paid@example.com',
      company: 'OperatorOS',
      brief: {
        offerSummary: 'Already paid checkout test',
        targetAudience: 'startup founders',
        primaryGoal: 'Book a call',
        packageHint: 'starter',
      },
    })

    const session = await createCheckoutSessionForProject({
      projectId: result.project.id,
      publicToken: result.project.publicToken,
    })
    await markPaymentSessionPaid(session.id)

    await assert.rejects(
      () => createCheckoutSessionForProject({ projectId: result.project.id, publicToken: result.project.publicToken }),
      /Project is already paid/,
    )
  })
})
