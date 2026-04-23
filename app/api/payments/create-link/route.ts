import { createCheckoutSessionForProject } from '@/src/lib/payments'
import { getSafeRedirectPath } from '@/src/lib/request-auth'

async function parseRequest(request: Request) {
  const contentType = request.headers.get('content-type') ?? ''

  if (request.method === 'GET') {
    const { searchParams } = new URL(request.url)
    return {
      projectId: searchParams.get('projectId') ?? '',
      token: searchParams.get('token') ?? '',
      redirectTo: getSafeRedirectPath(searchParams.get('redirectTo')),
    }
  }

  if (contentType.includes('application/json')) {
    const body = await request.json().catch(() => ({}))
    return {
      projectId: typeof body?.projectId === 'string' ? body.projectId : '',
      token: typeof body?.token === 'string' ? body.token : '',
      redirectTo: getSafeRedirectPath(typeof body?.redirectTo === 'string' ? body.redirectTo : null),
    }
  }

  const form = await request.formData()
  return {
    projectId: typeof form.get('projectId') === 'string' ? String(form.get('projectId')) : '',
    token: typeof form.get('token') === 'string' ? String(form.get('token')) : '',
    redirectTo: getSafeRedirectPath(typeof form.get('redirectTo') === 'string' ? String(form.get('redirectTo')) : null),
  }
}

async function handle(request: Request) {
  const { projectId, token, redirectTo } = await parseRequest(request)

  if (!projectId) {
    return new Response(JSON.stringify({ error: 'Project ID required' }), { status: 400 })
  }

  if (!token) {
    return new Response(JSON.stringify({ error: 'Valid project access token required' }), { status: 401 })
  }

  try {
    const session = await createCheckoutSessionForProject({
      projectId,
      publicToken: token,
      baseUrl: null,
    })

    if (request.method !== 'GET' && redirectTo) {
      return Response.redirect(new URL(session.checkoutUrl, request.url), 303)
    }

    return Response.json({
      checkoutUrl: session.checkoutUrl,
      provider: session.provider,
      paymentSessionId: session.id,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Checkout creation failed'
    return new Response(JSON.stringify({ error: message }), { status: 400 })
  }
}

export async function POST(request: Request) {
  return handle(request)
}
