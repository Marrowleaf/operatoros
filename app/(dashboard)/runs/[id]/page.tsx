import { PrismaClient } from '@prisma/client'
import { shouldUseDatabase } from '@/src/lib/runtime-mode'

const prisma = new PrismaClient()

export default async function RunReplayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const actions = shouldUseDatabase()
    ? await prisma.action.findMany({
        where: { projectId: id },
        orderBy: { createdAt: 'asc' },
      })
    : [
        {
          id: 'demo-action-1',
          type: 'lead_received',
          status: 'success',
          inputJson: { projectId: id },
          outputJson: { quote: { packageType: 'starter', price: 149 } },
        },
        {
          id: 'demo-action-2',
          type: 'quote_generated',
          status: 'success',
          inputJson: { packageHint: 'starter' },
          outputJson: { packageType: 'starter', price: 149 },
        },
      ]

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-16 text-zinc-100">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-4xl font-semibold">Run replay</h1>
        <div className="mt-8 grid gap-4">
          {actions.map((action) => (
            <div key={action.id} className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
              <div className="flex items-center justify-between gap-4">
                <strong>{action.type}</strong>
                <span className="text-xs uppercase tracking-wide text-zinc-400">{action.status}</span>
              </div>
              <pre className="mt-4 overflow-x-auto rounded-xl bg-zinc-950 p-4 text-xs text-zinc-300">
                {JSON.stringify({ input: action.inputJson, output: action.outputJson }, null, 2)}
              </pre>
            </div>
          ))}
          {actions.length === 0 ? <p className="text-zinc-400">No actions recorded for this project yet.</p> : null}
        </div>
      </div>
    </main>
  )
}
