import { PrismaClient } from '@prisma/client'
import { shouldUseDatabase } from '@/src/lib/runtime-mode'

const prisma = new PrismaClient()

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json()
  const status = body?.status === 'approved' ? 'approved' : 'rejected'
  const resolverNote = typeof body?.resolverNote === 'string' ? body.resolverNote : null

  if (!shouldUseDatabase()) {
    return Response.json({
      approval: {
        id,
        status,
        resolverNote,
        mode: 'demo',
      },
    })
  }

  const approval = await prisma.approval.update({
    where: { id },
    data: {
      status,
      resolverNote,
      resolvedAt: new Date(),
    },
  })

  return Response.json({ approval })
}
