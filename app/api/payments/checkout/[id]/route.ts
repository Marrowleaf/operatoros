import { markPaymentSessionPaid } from '@/src/lib/payments'
import { getPublicProjectById, getPaymentSessionById } from '@/src/lib/store'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const contentType = request.headers.get('content-type') ?? ''
  let token = ''
  let redirectTo = ''

  if (contentType.includes('application/json')) {
    const body = await request.json().catch(() => ({}))
    token = typeof body?.token === 'string' ? body.token : ''
    redirectTo = typeof body?.redirectTo === 'string' ? body.redirectTo : ''
  } else {
    const form = await request.formData()
    token = typeof form.get('token') === 'string' ? String(form.get('token')) : ''
    redirectTo = typeof form.get('redirectTo') === 'string' ? String(form.get('redirectTo')) : ''
  }

  const session = await getPaymentSessionById(id)
  if (!session) {
    return new Response(JSON.stringify({ error: 'Payment session not found' }), { status: 404 })
  }

  const project = await getPublicProjectById(session.projectId, token)
  if (!project) {
    return new Response(JSON.stringify({ error: 'Valid project access token required' }), { status: 401 })
  }

  if (session.provider !== 'sandbox' || process.env.OPERATOROS_ALLOW_SANDBOX_PAYMENTS !== '1') {
    return new Response(JSON.stringify({ error: 'Sandbox checkout is disabled' }), { status: 403 })
  }

  await markPaymentSessionPaid(id)

  if (redirectTo.startsWith('/')) {
    return Response.redirect(new URL(redirectTo, request.url), 303)
  }

  return Response.json({ ok: true })
}
