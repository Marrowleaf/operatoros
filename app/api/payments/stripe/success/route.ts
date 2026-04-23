import { confirmStripePaymentSession, getPaymentSessionById } from '@/src/lib/payments'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const paymentSessionId = url.searchParams.get('paymentSessionId') ?? ''

  if (!paymentSessionId) {
    return new Response('Missing paymentSessionId', { status: 400 })
  }

  try {
    const paymentSession = await getPaymentSessionById(paymentSessionId)
    if (!paymentSession) {
      return new Response('Payment session not found', { status: 404 })
    }

    await confirmStripePaymentSession(paymentSessionId)
    return Response.redirect(new URL(`/checkout/${paymentSession.id}?status=success`, request.url), 303)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Stripe confirmation failed'
    return new Response(message, { status: 400 })
  }
}
