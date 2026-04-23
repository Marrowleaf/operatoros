export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { getPublicProjectById } from '@/src/lib/store'

export default async function PreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ token?: string }>
}) {
  const { id } = await params
  const { token } = await searchParams
  const project = await getPublicProjectById(id, token ?? '')

  if (!project || !project.memory.draft) {
    notFound()
  }

  return <iframe title={`preview-${id}`} srcDoc={project.memory.draft.html} style={{ border: 0, width: '100%', minHeight: '100vh', background: '#09090b' }} />
}
