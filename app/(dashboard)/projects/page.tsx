import { PrismaClient } from '@prisma/client'
import { shouldUseDatabase } from '@/src/lib/runtime-mode'

const prisma = new PrismaClient()

export default async function ProjectsPage() {
  const projects = shouldUseDatabase()
    ? await prisma.project.findMany({
        orderBy: { createdAt: 'desc' },
        include: { customer: true },
        take: 20,
      })
    : [
        {
          id: 'demo-project',
          status: 'quoted',
          quotedPrice: 149,
          customer: { name: 'Demo founder', email: 'demo@operatoros.local' },
        },
      ]

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-16 text-zinc-100">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-4xl font-semibold">Projects</h1>
        <div className="mt-8 grid gap-4">
          {projects.map((project) => (
            <div key={project.id} className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="font-semibold">{project.customer.name}</h2>
                  <p className="text-sm text-zinc-400">{project.customer.email}</p>
                </div>
                <div className="text-right text-sm text-zinc-300">
                  <div>Status: {project.status}</div>
                  <div>Quote: {project.quotedPrice ? `£${project.quotedPrice}` : '—'}</div>
                </div>
              </div>
            </div>
          ))}
          {projects.length === 0 ? <p className="text-zinc-400">No projects yet.</p> : null}
        </div>
      </div>
    </main>
  )
}
