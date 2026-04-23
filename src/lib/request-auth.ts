import { createHmac, timingSafeEqual } from 'node:crypto'

export const OWNER_SESSION_COOKIE_NAME = 'operatoros_owner_session'
const OWNER_SESSION_TTL_SECONDS = 60 * 60 * 24 * 7

export function getSafeRedirectPath(value: string | null | undefined) {
  if (!value) return null
  if (!value.startsWith('/')) return null
  if (value.startsWith('//')) return null
  return value
}

function getOwnerPassword() {
  return process.env.OWNER_PASSWORD?.trim() ?? ''
}

function signOwnerSessionPayload(payload: string) {
  return createHmac('sha256', getOwnerPassword()).update(payload).digest('base64url')
}

function parseOwnerSessionPayload(payload: string): { exp: number } | null {
  const raw = Buffer.from(payload, 'base64url').toString('utf8')
  const parsed = JSON.parse(raw) as { exp?: number }
  return typeof parsed.exp === 'number' ? { exp: parsed.exp } : null
}

function parseCookieHeader(header: string | null | undefined) {
  return new Map(
    (header ?? '')
      .split(';')
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const index = part.indexOf('=')
        return index === -1 ? [part, ''] : [part.slice(0, index), part.slice(index + 1)]
      }),
  )
}

function hasMatchingSignature(payload: string, signature: string) {
  const expected = signOwnerSessionPayload(payload)
  const actualBuffer = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expected)

  if (actualBuffer.length !== expectedBuffer.length) {
    return false
  }

  return timingSafeEqual(actualBuffer, expectedBuffer)
}

export function createOwnerSessionValue(now = Date.now()) {
  if (!getOwnerPassword()) {
    throw new Error('OWNER_PASSWORD not configured')
  }

  const payload = Buffer.from(JSON.stringify({ exp: now + OWNER_SESSION_TTL_SECONDS * 1000 })).toString('base64url')
  const signature = signOwnerSessionPayload(payload)
  return `${payload}.${signature}`
}

export function verifyOwnerSessionValue(value: string | null | undefined, now = Date.now()) {
  if (!value || !getOwnerPassword()) {
    return false
  }

  const [payload, signature] = value.split('.')
  if (!payload || !signature || !hasMatchingSignature(payload, signature)) {
    return false
  }

  try {
    const parsed = parseOwnerSessionPayload(payload)
    return parsed !== null && parsed.exp > now
  } catch {
    return false
  }
}

export function isOwnerCookieAuthorized(cookieHeader: string | null | undefined) {
  const cookies = parseCookieHeader(cookieHeader)
  return verifyOwnerSessionValue(cookies.get(OWNER_SESSION_COOKIE_NAME) ?? null)
}

export function isOwnerProxyAuthorized(request: Request) {
  return request.headers.get('x-operatoros-owner-auth') === '1'
}

function getRequestOrigin(request: Request) {
  const protocol = request.headers.get('x-forwarded-proto') ?? new URL(request.url).protocol.replace(':', '')
  const host = request.headers.get('host') ?? new URL(request.url).host

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

export function validateOwnerPassword(password: string | null | undefined) {
  const expected = getOwnerPassword()
  if (!expected || !password) {
    return false
  }

  const actualBuffer = Buffer.from(password)
  const expectedBuffer = Buffer.from(expected)
  if (actualBuffer.length !== expectedBuffer.length) {
    return false
  }

  return timingSafeEqual(actualBuffer, expectedBuffer)
}

export function isSecureRequest(request: Request) {
  return (request.headers.get('x-forwarded-proto') ?? new URL(request.url).protocol.replace(':', '')) === 'https'
}

export function createOwnerSessionCookie(sessionValue: string, secure: boolean) {
  return `${OWNER_SESSION_COOKIE_NAME}=${sessionValue}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${OWNER_SESSION_TTL_SECONDS}${secure ? '; Secure' : ''}`
}

export function clearOwnerSessionCookie(secure: boolean) {
  return `${OWNER_SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure ? '; Secure' : ''}`
}

export function requireOwnerRequest(request: Request) {
  const isAuthorized = isOwnerProxyAuthorized(request) || isOwnerCookieAuthorized(request.headers.get('cookie'))

  if (!isAuthorized) {
    throw new Error('Owner authorization required')
  }

  if (!isTrustedOwnerOrigin(request)) {
    throw new Error('Trusted owner origin required')
  }
}
