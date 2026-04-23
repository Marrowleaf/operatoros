import { PrismaClient } from '@prisma/client'
import { generateQuote, type ProjectBrief } from '@/src/policies/quote-policy'
import { recordAction } from '@/src/lib/action-ledger'
import { shouldUseDatabase } from '@/src/lib/runtime-mode'

const prisma = new PrismaClient()

export async function createProjectFromBrief(input: {
  name: string
  email: string
  company?: string
  brief: ProjectBrief
}) {
  const quote = generateQuote(input.brief)

  if (!shouldUseDatabase()) {
    const projectId = crypto.randomUUID()
    return {
      lead: {
        id: crypto.randomUUID(),
        name: input.name,
        email: input.email,
      },
      customer: {
        id: crypto.randomUUID(),
        name: input.name,
        email: input.email,
      },
      project: {
        id: projectId,
        status: quote.status === 'ok' ? 'quoted' : 'escalated',
        packageType: quote.status === 'ok' ? quote.packageType : null,
        quotedPrice: quote.status === 'ok' ? quote.price : null,
      },
      quote,
      mode: 'demo' as const,
    }
  }

  const lead = await prisma.lead.create({
    data: {
      name: input.name,
      email: input.email,
      company: input.company,
      offerSummary: input.brief.offerSummary,
      targetAudience: input.brief.targetAudience,
      primaryGoal: input.brief.primaryGoal,
      packageHint: input.brief.packageHint,
    },
  })

  let customer = await prisma.customer.findUnique({ where: { email: input.email } })

  if (!customer) {
    customer = await prisma.customer.create({
      data: {
        name: input.name,
        email: input.email,
        company: input.company,
      },
    })
  }

  const project = await prisma.project.create({
    data: {
      customerId: customer.id,
      status: quote.status === 'ok' ? 'quoted' : 'escalated',
      packageType: quote.status === 'ok' ? quote.packageType : null,
      quotedPrice: quote.status === 'ok' ? quote.price : null,
      memoryJson: {
        brief: input.brief,
        leadId: lead.id,
        quote,
        acceptedDirections: [],
        rejectedDirections: [],
        revisions: [],
      },
    },
  })

  await recordAction({
    prisma,
    projectId: project.id,
    type: 'lead_received',
    inputJson: input,
    outputJson: { leadId: lead.id, quote },
  })

  return { lead, customer, project, quote, mode: 'database' as const }
}
