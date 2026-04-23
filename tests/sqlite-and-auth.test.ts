import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { DatabaseSync } from 'node:sqlite'

import { createProjectFromBrief } from '../src/lib/project-intake'
import { resetDb } from '../src/lib/store'
import { createOwnerSessionValue, requireOwnerRequest, verifyOwnerSessionValue } from '../src/lib/request-auth'

async function withTempSqlitePath(run: (sqlitePath: string) => Promise<void>) {
  const tempDir = await mkdtemp(path.join(tmpdir(), 'operatoros-sqlite-test-'))
  const sqlitePath = path.join(tempDir, 'operatoros-test.sqlite')
  const previousDatabasePath = process.env.OPERATOROS_DATABASE_PATH
  const previousDataPath = process.env.OPERATOROS_DATA_PATH

  process.env.OPERATOROS_DATABASE_PATH = sqlitePath
  delete process.env.OPERATOROS_DATA_PATH

  try {
    await run(sqlitePath)
  } finally {
    if (previousDatabasePath === undefined) {
      delete process.env.OPERATOROS_DATABASE_PATH
    } else {
      process.env.OPERATOROS_DATABASE_PATH = previousDatabasePath
    }

    if (previousDataPath === undefined) {
      delete process.env.OPERATOROS_DATA_PATH
    } else {
      process.env.OPERATOROS_DATA_PATH = previousDataPath
    }

    await rm(tempDir, { recursive: true, force: true })
  }
}

test('project data is persisted into sqlite state', async () => {
  await withTempSqlitePath(async (sqlitePath) => {
    await resetDb()

    const result = await createProjectFromBrief({
      name: 'James',
      email: 'sqlite@example.com',
      company: 'OperatorOS',
      brief: {
        offerSummary: 'Autonomous landing page studio',
        targetAudience: 'bootstrapped founders',
        primaryGoal: 'Book a call',
        packageHint: 'starter',
      },
    })

    const db = new DatabaseSync(sqlitePath)
    const row = db.prepare('SELECT data FROM app_state WHERE id = 1').get() as { data: string } | undefined
    db.close()

    assert.ok(row)
    const state = JSON.parse(row!.data) as { projects: Array<{ id: string }> }
    assert.equal(state.projects.length, 1)
    assert.equal(state.projects[0]?.id, result.project.id)

    const rawBytes = await readFile(sqlitePath)
    assert.equal(rawBytes.subarray(0, 6).toString(), 'SQLite')
  })
})

test('owner session cookie is signed and accepted for trusted requests', async () => {
  process.env.OWNER_PASSWORD = 'correct horse battery staple'
  const sessionValue = createOwnerSessionValue()

  assert.equal(verifyOwnerSessionValue(sessionValue), true)

  const request = new Request('http://operatoros.test/api/projects/123/actions', {
    method: 'POST',
    headers: {
      cookie: `operatoros_owner_session=${sessionValue}`,
      origin: 'http://operatoros.test',
      host: 'operatoros.test',
    },
  })

  assert.doesNotThrow(() => requireOwnerRequest(request))
})

test('owner session cookie is rejected when missing or tampered', async () => {
  process.env.OWNER_PASSWORD = 'correct horse battery staple'
  const sessionValue = createOwnerSessionValue()

  assert.equal(verifyOwnerSessionValue(`${sessionValue}tampered`), false)

  const request = new Request('http://operatoros.test/api/projects/123/actions', {
    method: 'POST',
    headers: {
      cookie: 'operatoros_owner_session=bad-value',
      origin: 'http://operatoros.test',
      host: 'operatoros.test',
    },
  })

  assert.throws(() => requireOwnerRequest(request), /Owner authorization required/)
})