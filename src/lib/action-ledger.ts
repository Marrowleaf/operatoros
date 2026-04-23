import type { PrismaClient } from '@prisma/client'

type ActionRecordInput = {
  prisma: PrismaClient
  projectId?: string
  type: string
  riskLevel?: 'low' | 'medium' | 'high'
  status?: 'success' | 'blocked' | 'pending' | 'failed'
  reason?: string
  inputJson?: unknown
  outputJson?: unknown
}

export async function recordAction({
  prisma,
  projectId,
  type,
  riskLevel = 'low',
  status = 'success',
  reason,
  inputJson,
  outputJson,
}: ActionRecordInput) {
  return prisma.action.create({
    data: {
      projectId,
      type,
      riskLevel,
      status,
      reason,
      inputJson: inputJson as never,
      outputJson: outputJson as never,
    },
  })
}
