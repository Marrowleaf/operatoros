import { resolveApproval } from '@/src/lib/workflows'
import { getSafeRedirectPath, requireRole } from '@/src/lib/request-auth'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireRole(request, ['owner', 'reviewer'])

    const { id } = await params
    const contentType = request.headers.get('content-type') ?? ''
    let status = 'rejected'
    let resolverNote: string | null = null
    let redirectTo: string | null = null

    if (contentType.includes('application/json')) {
      const body = await request.json()
      status = body?.status === 'approved' ? 'approved' : 'rejected'
      resolverNote = typeof body?.resolverNote === 'string' ? body.resolverNote : null
      redirectTo = getSafeRedirectPath(typeof body?.redirectTo === 'string' ? body.redirectTo : null)
    } else {
      const form = await request.formData()
      status = form.get('status') === 'approved' ? 'approved' : 'rejected'
      resolverNote = typeof form.get('resolverNote') === 'string' ? String(form.get('resolverNote')) : null
      redirectTo = getSafeRedirectPath(typeof form.get('redirectTo') === 'string' ? String(form.get('redirectTo')) : null)
    }

    const project = await resolveApproval({ approvalId: id, status: status as 'approved' | 'rejected', resolverNote })

    if (redirectTo) {
      return Response.redirect(new URL(redirectTo, request.url), 303)
    }

    return Response.json({
      approval: {
        id,
        status,
        resolverNote,
      },
      projectId: project.id,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to resolve approval'
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
