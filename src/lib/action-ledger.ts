import { createId, nowIso, updateDb } from '@/src/lib/store'

type ActionRecordInput = {
  projectId?: string
  type: string
  riskLevel?: 'low' | 'medium' | 'high'
  status?: 'success' | 'blocked' | 'pending' | 'failed'
  reason?: string
  input?: unknown
  output?: unknown
}

export async function recordAction({
  projectId,
  type,
  riskLevel = 'low',
  status = 'success',
  reason,
  input,
  output,
}: ActionRecordInput) {
  const createdAt = nowIso()

  return updateDb((db) => {
    const action = {
      id: createId(),
      projectId: projectId ?? null,
      type,
      riskLevel,
      status,
      reason: reason ?? null,
      input,
      output,
      createdAt,
    }

    db.actions.push(action)
    return action
  })
}
