import { PACKAGES } from '@/src/policies/packages'
import { generateQuote, type ProjectBrief } from '@/src/policies/quote-policy'
import { recordAction } from '@/src/lib/action-ledger'
import { buildLandingPageConfig, renderLandingPageHtml } from '@/src/lib/page-generator'
import { createId, createPublicToken, nowIso, updateDb, type ProjectRecord } from '@/src/lib/store'

export async function createProjectFromBrief(input: {
  name: string
  email: string
  company?: string
  brief: ProjectBrief
}) {
  const quote = generateQuote(input.brief)
  const timestamp = nowIso()

  const result = await updateDb((db) => {
    const lead = {
      id: createId(),
      name: input.name,
      email: input.email,
      company: input.company ?? null,
      offerSummary: input.brief.offerSummary,
      targetAudience: input.brief.targetAudience,
      primaryGoal: input.brief.primaryGoal,
      packageHint: input.brief.packageHint ?? null,
      createdAt: timestamp,
    }
    db.leads.push(lead)

    let customer = db.customers.find((entry) => entry.email === input.email)
    if (!customer) {
      customer = {
        id: createId(),
        name: input.name,
        email: input.email,
        company: input.company ?? null,
        createdAt: timestamp,
      }
      db.customers.push(customer)
    }

    const draft =
      quote.status === 'ok'
        ? (() => {
            const config = buildLandingPageConfig({
              offerSummary: input.brief.offerSummary,
              targetAudience: input.brief.targetAudience,
              primaryGoal: input.brief.primaryGoal,
              company: input.company,
              packageLabel: PACKAGES[quote.packageType].label,
            })

            return {
              generatedAt: timestamp,
              config,
              html: renderLandingPageHtml(config),
            }
          })()
        : null

    const project: ProjectRecord = {
      id: createId(),
      customerId: customer.id,
      publicToken: createPublicToken(),
      status: quote.status === 'ok' ? 'quoted' : 'escalated',
      packageType: quote.status === 'ok' ? quote.packageType : null,
      quotedPrice: quote.status === 'ok' ? quote.price : null,
      paidAmount: 0,
      deliveryUrl: quote.status === 'ok' ? `/preview/${lead.id}` : null,
      createdAt: timestamp,
      updatedAt: timestamp,
      memory: {
        brief: input.brief,
        quote,
        draft,
        revisions: [],
        pendingAction: null,
      },
    }

    project.deliveryUrl = quote.status === 'ok' ? `/preview/${project.id}` : null
    db.projects.push(project)

    return { lead, customer, project, quote, mode: 'persistent-file' as const }
  })

  await recordAction({
    projectId: result.project.id,
    type: 'lead_received',
    input,
    output: { quote },
  })

  if (quote.status === 'ok') {
    await recordAction({
      projectId: result.project.id,
      type: 'quote_generated',
      output: quote,
    })
    await recordAction({
      projectId: result.project.id,
      type: 'draft_generated',
      output: { deliveryUrl: `/preview/${result.project.id}` },
    })
  }

  return result
}
