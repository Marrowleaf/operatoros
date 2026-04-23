import { createHmac, timingSafeEqual } from 'node:crypto'

export const OWNER_SESSION_COOKIE_NAME = 'operatoros_owner_session'
const OWNER_SESSION_TTL_SECONDS = 60 * 60 * 24 * 7

export type OperatorRole = 'owner' | 'operator' | 'reviewer'
export type OperatorUser = {
  username: string
  password: string
  role: OperatorRole
}
export type OperatorSession = {
  username: string
  role: OperatorRole
  exp: number
}

export function getSafeRedirectPath(value: string | null | undefined) {
  if (!value) return null
  if (!value.startsWith('/')) return null
  if (value.startsWith('//')) return null
  return value
}

function getLegacyOwnerPassword() {
  return process.env.OWNER_PASSWORD?.trim() ?? ''
}

export function getOperatorUsers(): OperatorUser[] {
  const configured = process.env.OPERATOROS_USERS_JSON?.trim()
  if (configured) {
    try {
      const parsed = JSON.parse(configured) as Array<Partial<OperatorUser>>
      const users = parsed.flatMap((entry) => {
        const username = typeof entry.username === 'string' ? entry.username.trim() : ''
        const password = typeof entry.password === 'string' ? entry.password : ''
        const role = entry.role === 'owner' || entry.role === 'operator' || entry.role === 'reviewer' ? entry.role : null
        return username && password && role ? [{ username, password, role }] : []
      })

      if (users.length > 0) {
        return users
      }
    } catch {
      // fall back to legacy env
    }
  }

  const legacyPassword = getLegacyOwnerPassword()
  return legacyPassword ? [{ username: 'operatoros', password: legacyPassword, role: 'owner' }] : []
}

function getSigningSecret() {
  const configuredUsers = process.env.OPERATOROS_USERS_JSON?.trim()
  if (configuredUsers) {
    return configuredUsers
  }

  return getLegacyOwnerPassword()
}

function signOwnerSessionPayload(payload: string) {
  return createHmac('sha256', getSigningSecret()).update(payload).digest('base64url')
}

function parseOwnerSessionPayload(payload: string): OperatorSession | null {
  const raw = Buffer.from(payload, 'base64url').toString('utf8')
  const parsed = JSON.parse(raw) as Partial<OperatorSession>
  const role = parsed.role === 'owner' || parsed.role === 'operator' || parsed.role === 'reviewer' ? parsed.role : null
  return typeof parsed.exp === 'number' && typeof parsed.username === 'string' && role
    ? { exp: parsed.exp, username: parsed.username, role }
    : null
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

export function validateOperatorCredentials(username: string | null | undefined, password: string | null | undefined) {
  if (!username || !password) {
    return null
  }

  const user = getOperatorUsers().find((entry) => entry.username === username)
  if (!user) {
    return null
  }

  const actualBuffer = Buffer.from(password)
  const expectedBuffer = Buffer.from(user.password)
  if (actualBuffer.length !== expectedBuffer.length) {
    return null
  }

  return timingSafeEqual(actualBuffer, expectedBuffer) ? { username: user.username, role: user.role } : null
}

export function validateOwnerPassword(password: string | null | undefined) {
  const legacyPassword = getLegacyOwnerPassword()
  if (!legacyPassword || !password) {
    return false
  }

  const actualBuffer = Buffer.from(password)
  const expectedBuffer = Buffer.from(legacyPassword)
  if (actualBuffer.length !== expectedBuffer.length) {
    return false
  }

  return timingSafeEqual(actualBuffer, expectedBuffer)
}

export function createOwnerSessionValue(user: { username: string; role: OperatorRole }, now = Date.now()) {
  if (!getSigningSecret()) {
    throw new Error('Owner auth not configured')
  }

  const payload = Buffer.from(
    JSON.stringify({ username: user.username, role: user.role, exp: now + OWNER_SESSION_TTL_SECONDS * 1000 }),
  ).toString('base64url')
  const signature = signOwnerSessionPayload(payload)
  return `${payload}.${signature}`
}

export function verifyOwnerSessionValue(value: string | null | undefined, now = Date.now()) {
  if (!value || !getSigningSecret()) {
    return null
  }

  const [payload, signature] = value.split('.')
  if (!payload || !signature || !hasMatchingSignature(payload, signature)) {
    return null
  }

  try {
    const parsed = parseOwnerSessionPayload(payload)
    return parsed !== null && parsed.exp > now ? parsed : null
  } catch {
    return null
  }
}

export function getSessionFromCookieHeader(cookieHeader: string | null | undefined) {
  const cookies = parseCookieHeader(cookieHeader)
  return verifyOwnerSessionValue(cookies.get(OWNER_SESSION_COOKIE_NAME) ?? null)
}

export function isOwnerCookieAuthorized(cookieHeader: string | null | undefined) {
  return getSessionFromCookieHeader(cookieHeader) !== null
}

export function isOwnerProxyAuthorized(_request: Request) {
  return false
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

export function isSecureRequest(request: Request) {
  return (request.headers.get('x-forwarded-proto') ?? new URL(request.url).protocol.replace(':', '')) === 'https'
}

export function createOwnerSessionCookie(sessionValue: string, secure: boolean) {
  return `${OWNER_SESSION_COOKIE_NAME}=${sessionValue}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${OWNER_SESSION_TTL_SECONDS}${secure ? '; Secure' : ''}`
}

export function clearOwnerSessionCookie(secure: boolean) {
  return `${OWNER_SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure ? '; Secure' : ''}`
}

function getAuthorizedSession(request: Request) {
  if (isOwnerProxyAuthorized(request)) {
    return { username: 'reverse-proxy', role: 'owner' as const, exp: Number.MAX_SAFE_INTEGER }
  }

  return getSessionFromCookieHeader(request.headers.get('cookie'))
}

export function requireOwnerRequest(request: Request) {
  const session = getAuthorizedSession(request)

  if (!session) {
    throw new Error('Owner authorization required')
  }

  if (!isTrustedOwnerOrigin(request)) {
    throw new Error('Trusted owner origin required')
  }

  return session
}

export function requireRole(request: Request, allowedRoles: OperatorRole[]) {
  const session = requireOwnerRequest(request)
  if (!allowedRoles.includes(session.role)) {
    throw new Error('Insufficient permissions')
  }
  return session
}
