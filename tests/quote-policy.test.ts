import test from 'node:test'
import assert from 'node:assert/strict'

import { generateQuote, isQuoteWithinPolicy } from '../src/policies/quote-policy'

test('quotes complex briefs into the bounded pro package', () => {
  const quote = generateQuote({
    offerSummary: 'Multi-page SaaS startup lead generation dashboard redesign',
    targetAudience: 'B2B startup buyers',
    primaryGoal: 'Book a demo',
    packageHint: 'pro',
  })

  assert.equal(quote.status, 'ok')
  if (quote.status === 'ok') {
    assert.equal(quote.packageType, 'pro')
    assert.equal(isQuoteWithinPolicy(quote.packageType, quote.price), true)
  }
})
