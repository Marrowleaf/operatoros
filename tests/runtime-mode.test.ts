import test from 'node:test'
import assert from 'node:assert/strict'

import { getRuntimeMode, shouldUseDatabase } from '../src/lib/runtime-mode'

test('runs in persistent file mode', () => {
  assert.equal(getRuntimeMode(), 'persistent-file')
  assert.equal(shouldUseDatabase(), false)
})
