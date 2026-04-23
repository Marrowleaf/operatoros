import { getProjectById } from '@/src/lib/store'

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const projectId = typeof body?.projectId === 'string' ? body.projectId : ''
  const project = projectId ? await getProjectById(projectId) : null

  if (!project) {
    return new Response(JSON.stringify({ error: 'Project not found' }), { status: 404 })
  }

  const amount = Number(body?.amount ?? project.quotedPrice ?? 0)

  if (!Number.isFinite(amount) || amount <= 0) {
    return new Response(JSON.stringify({ error: 'Invalid amount' }), { status: 400 })
  }

  const reference = project.id.slice(0, 8).toUpperCase()

  return Response.json({
    checkoutUrl: `/project/${project.id}`,
    mode: 'manual-review',
    instructions: `Manual payment placeholder for now. Send the amount and use reference ${reference}. Then mark the project paid from the owner dashboard.`,
  })
}
