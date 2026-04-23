import { PACKAGES, type PackageType } from './packages'

export type QuoteResult =
  | { status: 'ok'; packageType: PackageType; price: number; reason: string }
  | { status: 'escalate'; reason: string }

export type ProjectBrief = {
  offerSummary: string
  targetAudience: string
  primaryGoal: string
  packageHint?: string | null
}

function scoreComplexity(brief: ProjectBrief) {
  const text = `${brief.offerSummary} ${brief.targetAudience} ${brief.primaryGoal}`.toLowerCase()
  let score = 0
  if (text.includes('redesign') || text.includes('improve')) score += 1
  if (text.includes('saas') || text.includes('startup')) score += 2
  if (text.includes('conversion') || text.includes('lead')) score += 1
  if (text.includes('multi') || text.includes('dashboard') || text.includes('app')) score += 3
  return score
}

export function generateQuote(brief: ProjectBrief): QuoteResult {
  const hinted = brief.packageHint?.toLowerCase()

  if (hinted?.includes('refresh')) {
    return { status: 'ok', packageType: 'refresh', price: 79, reason: 'Existing-page refresh request matched Refresh package.' }
  }

  const complexity = scoreComplexity(brief)

  if (complexity >= 4) {
    return { status: 'ok', packageType: 'pro', price: 249, reason: 'Brief needs stronger positioning and a more custom structure.' }
  }

  if (complexity >= 2) {
    return { status: 'ok', packageType: 'starter', price: 149, reason: 'Brief fits a custom one-page launch scope within Starter limits.' }
  }

  if (brief.offerSummary.trim().length < 8) {
    return { status: 'escalate', reason: 'Brief is too thin to quote safely.' }
  }

  return { status: 'ok', packageType: 'starter', price: 99, reason: 'Brief fits a straightforward one-page launch page.' }
}

export function isQuoteWithinPolicy(packageType: PackageType, price: number) {
  const pkg = PACKAGES[packageType]
  return price >= pkg.priceMin && price <= pkg.priceMax
}
