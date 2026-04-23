import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'

import { getSafeRedirectPath, OWNER_SESSION_COOKIE_NAME, verifyOwnerSessionValue } from '@/src/lib/request-auth'

export async function isOwnerPageAuthenticated() {
  const cookieStore = await cookies()
  const headerStore = await headers()

  return (
    headerStore.get('x-operatoros-owner-auth') === '1' ||
    verifyOwnerSessionValue(cookieStore.get(OWNER_SESSION_COOKIE_NAME)?.value ?? null)
  )
}

export async function requireOwnerPage(nextPath: string) {
  if (await isOwnerPageAuthenticated()) {
    return
  }

  const safeNext = getSafeRedirectPath(nextPath) ?? '/projects'
  redirect(`/owner/login?next=${encodeURIComponent(safeNext)}`)
}
