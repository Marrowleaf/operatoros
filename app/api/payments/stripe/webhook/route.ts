import { createHmac, timingSafeEqual } from 'node:crypto'

import { confirmStripePaymentSessionByProviderSessionId } from '@/src/lib/payments'

function verifyStripeWebhookSignature(payload: string, signatureHeader: string | null, secret: string) {
  if (!signatureHeader) return false

  const parts = Object.fromEntries(
    signatureHeader.split(',').map((entry) => {
      const [key, value] = entry.split('=')
      return [key, value]
    }),
  ) as Record<string, string | undefined>

  const timestamp = parts.t
  const signature = parts.v1
  if (!timestamp || !signature) return false

  const expected = createHmac('sha256', secret).update(`${timestamp}.${payload}`).digest('hex')
  const actualBuffer = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expected)
  if (actualBuffer.length !== expectedBuffer.length) return false
  return timingSafeEqual(actualBuffer, expectedBuffer)
}

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim()
  if (!webhookSecret) {
    return new Response('STRIPE_WEBHOOK_SECRET not configured', { status: 500 })
  }

  const payload = await request.text()
  const signature = request.headers.get('stripe-signature')
  if (!verifyStripeWebhookSignature(payload, signature, webhookSecret)) {
    return new Response('Invalid Stripe signature', { status: 400 })
  }

  const event = JSON.parse(payload) as {
    type?: string
    data?: { object?: { id?: string; payment_status?: string; status?: string } }
  }

  if (event.type === 'checkout.session.completed') {
    const sessionId = event.data?.object?.id
    if (sessionId && (event.data?.object?.payment_status === 'paid' || event.data?.object?.status === 'complete')) {
      await confirmStripePaymentSessionByProviderSessionId(sessionId)
    }
  }

  return Response.json({ received: true })
}
