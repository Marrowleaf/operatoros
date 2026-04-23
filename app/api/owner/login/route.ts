import {
  createOwnerSessionCookie,
  createOwnerSessionValue,
  getSafeRedirectPath,
  isSecureRequest,
  validateOwnerPassword,
} from '@/src/lib/request-auth'

export async function POST(request: Request) {
  const contentType = request.headers.get('content-type') ?? ''
  let password = ''
  let redirectTo: string | null = null

  if (contentType.includes('application/json')) {
    const body = await request.json().catch(() => ({}))
    password = typeof body?.password === 'string' ? body.password : ''
    redirectTo = getSafeRedirectPath(typeof body?.redirectTo === 'string' ? body.redirectTo : null)
  } else {
    const form = await request.formData()
    password = typeof form.get('password') === 'string' ? String(form.get('password')) : ''
    redirectTo = getSafeRedirectPath(typeof form.get('redirectTo') === 'string' ? String(form.get('redirectTo')) : null)
  }

  if (!validateOwnerPassword(password)) {
    if (redirectTo) {
      const destination = `/owner/login?error=invalid&next=${encodeURIComponent(redirectTo)}`
      return new Response(null, {
        status: 303,
        headers: {
          Location: destination,
        },
      })
    }

    return new Response(JSON.stringify({ error: 'Invalid owner password' }), { status: 401 })
  }

  const sessionValue = createOwnerSessionValue()
  const headers = new Headers({
    'Set-Cookie': createOwnerSessionCookie(sessionValue, isSecureRequest(request)),
  })

  if (redirectTo) {
    headers.set('Location', redirectTo)
    return new Response(null, { status: 303, headers })
  }

  headers.set('Content-Type', 'application/json')
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers })
}
