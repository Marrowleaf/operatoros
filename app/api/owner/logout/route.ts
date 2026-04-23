import { clearOwnerSessionCookie, getSafeRedirectPath, isSecureRequest } from '@/src/lib/request-auth'

export async function POST(request: Request) {
  const contentType = request.headers.get('content-type') ?? ''
  let redirectTo: string | null = '/owner/login'

  if (contentType.includes('application/json')) {
    const body = await request.json().catch(() => ({}))
    redirectTo = getSafeRedirectPath(typeof body?.redirectTo === 'string' ? body.redirectTo : redirectTo)
  } else {
    const form = await request.formData()
    redirectTo = getSafeRedirectPath(typeof form.get('redirectTo') === 'string' ? String(form.get('redirectTo')) : redirectTo)
  }

  return new Response(null, {
    status: 303,
    headers: {
      Location: redirectTo ?? '/owner/login',
      'Set-Cookie': clearOwnerSessionCookie(isSecureRequest(request)),
    },
  })
}
