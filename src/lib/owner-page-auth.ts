import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { getSafeRedirectPath, OWNER_SESSION_COOKIE_NAME, type OperatorRole, verifyOwnerSessionValue } from '@/src/lib/request-auth'

function getDefaultPathForRole(role: OperatorRole) {
  if (role === 'reviewer') return '/approvals'
  return '/projects'
}

export async function getOwnerPageSession() {
  const cookieStore = await cookies()
  return verifyOwnerSessionValue(cookieStore.get(OWNER_SESSION_COOKIE_NAME)?.value ?? null)
}

export async function isOwnerPageAuthenticated() {
  return (await getOwnerPageSession()) !== null
}

export async function requireOwnerPage(nextPath: string, allowedRoles: OperatorRole[] = ['owner', 'operator', 'reviewer']) {
  const session = await getOwnerPageSession()

  if (session && allowedRoles.includes(session.role)) {
    return session
  }

  if (session) {
    redirect(getDefaultPathForRole(session.role))
  }

  const safeNext = getSafeRedirectPath(nextPath) ?? '/projects'
  redirect(`/owner/login?next=${encodeURIComponent(safeNext)}`)
}

export function getDefaultOperatorPath(role: OperatorRole) {
  return getDefaultPathForRole(role)
}
