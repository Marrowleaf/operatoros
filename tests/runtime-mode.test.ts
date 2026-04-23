import test from 'node:test'
import assert from 'node:assert/strict'

import { getRuntimeMode, shouldUseDatabase } from '../src/lib/runtime-mode'

test('runs in persistent sqlite mode', () => {
  assert.equal(getRuntimeMode(), 'persistent-sqlite')
  assert.equal(shouldUseDatabase(), true)
})
