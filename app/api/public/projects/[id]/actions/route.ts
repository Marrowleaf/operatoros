import { requestPayment, requestRevision } from '@/src/lib/workflows'
import { getSafeRedirectPath } from '@/src/lib/request-auth'
import { getPublicProjectById } from '@/src/lib/store'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const contentType = request.headers.get('content-type') ?? ''
    let action = ''
    let note = ''
    let token = ''
    let redirectTo: string | null = null

    if (contentType.includes('application/json')) {
      const body = await request.json()
      action = typeof body?.action === 'string' ? body.action : ''
      note = typeof body?.note === 'string' ? body.note : ''
      token = typeof body?.token === 'string' ? body.token : ''
      redirectTo = getSafeRedirectPath(typeof body?.redirectTo === 'string' ? body.redirectTo : null)
    } else {
      const form = await request.formData()
      action = typeof form.get('action') === 'string' ? String(form.get('action')) : ''
      note = typeof form.get('note') === 'string' ? String(form.get('note')) : ''
      token = typeof form.get('token') === 'string' ? String(form.get('token')) : ''
      redirectTo = getSafeRedirectPath(typeof form.get('redirectTo') === 'string' ? String(form.get('redirectTo')) : null)
    }

    const project = await getPublicProjectById(id, token)
    if (!project) {
      return new Response(JSON.stringify({ error: 'Valid project access token required' }), { status: 401 })
    }

    let payload: unknown

    if (action === 'request_payment') {
      payload = await requestPayment(id)
    } else if (action === 'request_revision') {
      payload = await requestRevision(id, note)
    } else {
      return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400 })
    }

    if (redirectTo) {
      return Response.redirect(new URL(redirectTo, request.url), 303)
    }

    return Response.json({ ok: true, payload })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Action failed'
    return new Response(JSON.stringify({ error: message }), { status: 400 })
  }
}
