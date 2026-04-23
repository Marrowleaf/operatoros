import test from 'node:test'
import assert from 'node:assert/strict'

import { getRuntimeMode, shouldUseDatabase } from '../src/lib/runtime-mode'

test('falls back to demo mode when DATABASE_URL is missing', () => {
  const original = process.env.DATABASE_URL
  delete process.env.DATABASE_URL

  assert.equal(getRuntimeMode(), 'demo')
  assert.equal(shouldUseDatabase(), false)

  if (original) process.env.DATABASE_URL = original
})

test('uses database mode when DATABASE_URL is present', () => {
  const original = process.env.DATABASE_URL
  process.env.DATABASE_URL = 'postgresql://demo'

  assert.equal(getRuntimeMode(), 'database')
  assert.equal(shouldUseDatabase(), true)

  if (original) process.env.DATABASE_URL = original
  else delete process.env.DATABASE_URL
})
