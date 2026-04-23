export function getSafeRedirectPath(value: string | null | undefined) {
  if (!value) return null
  if (!value.startsWith('/')) return null
  if (value.startsWith('//')) return null
  return value
}

function getRequestOrigin(request: Request) {
  const protocol = request.headers.get('x-forwarded-proto') ?? 'http'
  const host = request.headers.get('host')

  if (!host) {
    throw new Error('Missing host header')
  }

  return `${protocol}://${host}`
}

function isTrustedOwnerOrigin(request: Request) {
  const expectedOrigin = getRequestOrigin(request)
  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')

  if (origin) {
    return origin === expectedOrigin
  }

  if (referer) {
    return referer.startsWith(`${expectedOrigin}/`) || referer === expectedOrigin
  }

  return false
}

export function requireOwnerRequest(request: Request) {
  const ownerHeader = request.headers.get('x-operatoros-owner-auth')

  if (ownerHeader !== '1') {
    throw new Error('Owner authorization required')
  }

  if (!isTrustedOwnerOrigin(request)) {
    throw new Error('Trusted owner origin required')
  }
}
