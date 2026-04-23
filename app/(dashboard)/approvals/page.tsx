import { PrismaClient } from '@prisma/client'
import { shouldUseDatabase } from '@/src/lib/runtime-mode'

const prisma = new PrismaClient()

export default async function ApprovalsPage() {
  const approvals = shouldUseDatabase()
    ? await prisma.approval.findMany({
        where: { status: 'pending' },
        orderBy: { createdAt: 'desc' },
        take: 20,
      })
    : [
        {
          id: 'demo-approval',
          actionType: 'refund',
          reason: 'Refund exceeds automatic threshold.',
        },
      ]

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-16 text-zinc-100">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-4xl font-semibold">Pending approvals</h1>
        <div className="mt-8 grid gap-4">
          {approvals.map((approval) => (
            <div key={approval.id} className="rounded-2xl border border-amber-500/30 bg-zinc-900/50 p-5">
              <p className="font-semibold">{approval.actionType}</p>
              <p className="mt-2 text-zinc-400">{approval.reason}</p>
            </div>
          ))}
          {approvals.length === 0 ? <p className="text-zinc-400">No pending approvals.</p> : null}
        </div>
      </div>
    </main>
  )
}
