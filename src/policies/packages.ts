export type PackageType = 'refresh' | 'starter' | 'pro'

export const PACKAGES = {
  refresh: {
    label: 'Refresh',
    priceMin: 79,
    priceMax: 79,
    revisionRounds: 1,
    fit: ['existing-page refresh', 'copy cleanup', 'cta cleanup'],
  },
  starter: {
    label: 'Starter',
    priceMin: 99,
    priceMax: 149,
    revisionRounds: 1,
    fit: ['waitlist page', 'simple launch page', 'service page'],
  },
  pro: {
    label: 'Pro',
    priceMin: 199,
    priceMax: 249,
    revisionRounds: 2,
    fit: ['saas landing page', 'startup launch', 'lead-gen page'],
  },
} as const
