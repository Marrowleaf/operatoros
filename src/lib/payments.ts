import { markProjectPaid, requestPayment } from '@/src/lib/workflows'
import {
  createId,
  getPaymentSessionById as getStoredPaymentSessionById,
  getPaymentSessionByProviderSessionId,
  getProjectById,
  getPublicProjectById,
  nowIso,
  updateDb,
  type PaymentSessionRecord,
} from '@/src/lib/store'

function getBaseUrl(explicitBaseUrl?: string | null) {
  return process.env.OPERATOROS_BASE_URL?.trim() || explicitBaseUrl?.trim() || 'http://localhost:3000'
}

function isSandboxPaymentsEnabled() {
  return process.env.OPERATOROS_ALLOW_SANDBOX_PAYMENTS === '1'
}

async function createStripeCheckoutSession(input: {
  projectId: string
  amount: number
  currency: string
  successUrl: string
  cancelUrl: string
}) {
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim()
  if (!secretKey) {
    return null
  }

  const body = new URLSearchParams()
  body.set('mode', 'payment')
  body.set('success_url', input.successUrl)
  body.set('cancel_url', input.cancelUrl)
  body.set('line_items[0][quantity]', '1')
  body.set('line_items[0][price_data][currency]', input.currency)
  body.set('line_items[0][price_data][unit_amount]', String(input.amount * 100))
  body.set('line_items[0][price_data][product_data][name]', `OperatorOS project ${input.projectId.slice(0, 8).toUpperCase()}`)
  body.set('metadata[project_id]', input.projectId)

  const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  })

  if (!response.ok) {
    throw new Error(`Stripe checkout creation failed with status ${response.status}`)
  }

  const payload = (await response.json()) as { id?: string; url?: string }
  if (!payload.id || !payload.url) {
    throw new Error('Stripe checkout response missing id or url')
  }

  return { provider: 'stripe' as const, providerSessionId: payload.id, checkoutUrl: payload.url }
}

export async function createCheckoutSessionForProject(input: {
  projectId: string
  publicToken?: string | null
  baseUrl?: string | null
}) {
  const project = input.publicToken
    ? await getPublicProjectById(input.projectId, input.publicToken)
    : await getProjectById(input.projectId)

  if (!project) {
    throw new Error('Project not found')
  }

  if (project.memory.quote.status !== 'ok') {
    throw new Error('Project must have an accepted quote before checkout')
  }

  const expectedAmount = project.quotedPrice ?? (project.memory.quote.status === 'ok' ? project.memory.quote.price : 0)
  if ((project.paidAmount ?? 0) >= expectedAmount || project.memory.paidAt) {
    throw new Error('Project is already paid')
  }

  if (project.status === 'quoted') {
    await requestPayment(project.id)
  }

  const amount = expectedAmount
  if (!amount || amount <= 0) {
    throw new Error('Project has no payable amount')
  }

  const reference = project.id.slice(0, 8).toUpperCase()
  const timestamp = nowIso()
  const baseUrl = getBaseUrl(input.baseUrl)
  const sessionId = createId()
  const successUrl = `${baseUrl}/api/payments/stripe/success?paymentSessionId=${sessionId}`
  const cancelUrl = `${baseUrl}/checkout/${sessionId}?status=cancelled`
  const stripeSession = await createStripeCheckoutSession({ projectId: project.id, amount, currency: 'gbp', successUrl, cancelUrl })
  if (!stripeSession && !isSandboxPaymentsEnabled()) {
    throw new Error('Sandbox payments are disabled until a real payment provider is configured')
  }
  const checkoutUrl = stripeSession?.checkoutUrl ?? `${baseUrl}/checkout/${sessionId}?token=${project.publicToken}`

  const session = await updateDb((db) => {
    for (const pending of db.paymentSessions.filter((entry) => entry.projectId === project.id && entry.status === 'pending')) {
      pending.status = 'cancelled'
      pending.updatedAt = timestamp
    }

    const created: PaymentSessionRecord = {
      id: sessionId,
      projectId: project.id,
      provider: stripeSession?.provider ?? 'sandbox',
      status: 'pending',
      amount,
      currency: 'gbp',
      checkoutUrl,
      providerSessionId: stripeSession?.providerSessionId ?? null,
      reference,
      createdAt: timestamp,
      updatedAt: timestamp,
      paidAt: null,
    }

    db.paymentSessions.push(created)
    return created
  })

  await updateDb((db) => {
    const entry = db.projects.find((item) => item.id === project.id)
    if (!entry) {
      throw new Error('Project not found')
    }

    entry.status = entry.status === 'quoted' ? 'awaiting_payment' : entry.status
    entry.updatedAt = timestamp
    entry.memory.paymentRequestedAt = timestamp
    entry.memory.paymentInstructions =
      session.provider === 'stripe'
        ? `Complete secure checkout using reference ${reference}.`
        : `Complete sandbox checkout using reference ${reference}.`
    return entry
  })

  return session
}

export async function markPaymentSessionPaid(paymentSessionId: string) {
  const existing = await getStoredPaymentSessionById(paymentSessionId)
  if (!existing) {
    throw new Error('Payment session not found')
  }

  if (existing.status !== 'paid') {
    if (existing.status !== 'pending') {
      throw new Error('Payment session is not payable')
    }

    const timestamp = nowIso()
    await updateDb((db) => {
      const session = db.paymentSessions.find((entry) => entry.id === paymentSessionId)
      if (!session) {
        throw new Error('Payment session not found')
      }

      session.status = 'paid'
      session.updatedAt = timestamp
      session.paidAt = timestamp
      return session
    })
  }

  const project = await getProjectById(existing.projectId)
  if (project && project.paidAmount < (project.quotedPrice ?? 0)) {
    await markProjectPaid(existing.projectId)
  }

  return getStoredPaymentSessionById(paymentSessionId)
}

export async function getPaymentSessionById(paymentSessionId: string) {
  return getStoredPaymentSessionById(paymentSessionId)
}

export async function confirmStripePaymentSession(paymentSessionId: string) {
  const session = await getStoredPaymentSessionById(paymentSessionId)
  if (!session) {
    throw new Error('Payment session not found')
  }

  if (session.provider !== 'stripe' || !session.providerSessionId) {
    throw new Error('Stripe payment session required')
  }

  const secretKey = process.env.STRIPE_SECRET_KEY?.trim()
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY not configured')
  }

  const response = await fetch(`https://api.stripe.com/v1/checkout/sessions/${session.providerSessionId}`, {
    headers: {
      Authorization: `Bearer ${secretKey}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Stripe checkout verification failed with status ${response.status}`)
  }

  const payload = (await response.json()) as { payment_status?: string; status?: string }
  if (payload.payment_status !== 'paid' && payload.status !== 'complete') {
    throw new Error('Stripe checkout is not paid yet')
  }

  return markPaymentSessionPaid(paymentSessionId)
}

export async function confirmStripePaymentSessionByProviderSessionId(providerSessionId: string) {
  const session = await getPaymentSessionByProviderSessionId(providerSessionId)
  if (!session) {
    throw new Error('Payment session not found')
  }

  return markPaymentSessionPaid(session.id)
}
