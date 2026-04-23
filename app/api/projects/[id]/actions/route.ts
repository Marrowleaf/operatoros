import { regenerateDraft, requestDelivery, requestPayment, markProjectPaid } from '@/src/lib/workflows'
import { getSafeRedirectPath, requireRole } from '@/src/lib/request-auth'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireRole(request, ['owner', 'operator'])

    const { id } = await params
    const contentType = request.headers.get('content-type') ?? ''
    let action = ''
    let note = ''
    let redirectTo: string | null = null

    if (contentType.includes('application/json')) {
      const body = await request.json()
      action = typeof body?.action === 'string' ? body.action : ''
      note = typeof body?.note === 'string' ? body.note : ''
      redirectTo = getSafeRedirectPath(typeof body?.redirectTo === 'string' ? body.redirectTo : null)
    } else {
      const form = await request.formData()
      action = typeof form.get('action') === 'string' ? String(form.get('action')) : ''
      note = typeof form.get('note') === 'string' ? String(form.get('note')) : ''
      redirectTo = getSafeRedirectPath(typeof form.get('redirectTo') === 'string' ? String(form.get('redirectTo')) : null)
    }

    let payload: unknown

    if (action === 'request_payment') {
      payload = await requestPayment(id)
    } else if (action === 'mark_paid') {
      payload = await markProjectPaid(id)
    } else if (action === 'regenerate_draft') {
      payload = await regenerateDraft(id, note)
    } else if (action === 'request_delivery') {
      payload = await requestDelivery(id)
    } else {
      return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400 })
    }

    if (redirectTo) {
      return Response.redirect(new URL(redirectTo, request.url), 303)
    }

    return Response.json({ ok: true, payload })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Action failed'
    const status =
      message === 'Owner authorization required'
        ? 401
        : message === 'Trusted owner origin required'
          ? 403
          : message === 'Insufficient permissions'
            ? 403
            : 400
    return new Response(JSON.stringify({ error: message }), { status })
  }
}
