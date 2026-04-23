import { starterTemplate, type LandingPageConfig } from '@/src/templates/landing-page/starter'

export function buildLandingPageConfig(input: {
  offerSummary: string
  targetAudience: string
  primaryGoal: string
}): LandingPageConfig {
  return {
    ...starterTemplate,
    headline: input.offerSummary,
    subheadline: `Built for ${input.targetAudience}. Primary goal: ${input.primaryGoal}.`,
    cta: input.primaryGoal,
  }
}
