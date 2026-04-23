export type LandingPageConfig = {
  eyebrow: string
  headline: string
  subheadline: string
  cta: string
  sections: Array<{ title: string; body: string }>
}

export const starterTemplate: LandingPageConfig = {
  eyebrow: 'Launch fast',
  headline: 'A clean page for your next launch.',
  subheadline: 'OperatorOS Studio turns a short brief into a structured landing page draft.',
  cta: 'Join the waitlist',
  sections: [
    {
      title: 'Clear message',
      body: 'Tell visitors what you do, who it is for, and why it matters.',
    },
    {
      title: 'Single action',
      body: 'Drive one main CTA instead of splitting attention.',
    },
    {
      title: 'Fast iteration',
      body: 'Use the first draft as a base, then refine with revisions.',
    },
  ],
}
