import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { DatabaseSync } from 'node:sqlite'

import { createProjectFromBrief } from '../src/lib/project-intake'
import { resetDb } from '../src/lib/store'
import {
  createOwnerSessionValue,
  getSessionFromCookieHeader,
  requireRole,
  requireOwnerRequest,
  verifyOwnerSessionValue,
} from '../src/lib/request-auth'

async function withTempSqlitePath(run: (sqlitePath: string) => Promise<void>) {
  const tempDir = await mkdtemp(path.join(tmpdir(), 'operatoros-sqlite-test-'))
  const sqlitePath = path.join(tempDir, 'operatoros-test.sqlite')
  const previousDatabasePath = process.env.OPERATOROS_DATABASE_PATH
  const previousDataPath = process.env.OPERATOROS_DATA_PATH
  const previousUsers = process.env.OPERATOROS_USERS_JSON
  const previousOwnerPassword = process.env.OWNER_PASSWORD

  process.env.OPERATOROS_DATABASE_PATH = sqlitePath
  delete process.env.OPERATOROS_DATA_PATH
  process.env.OPERATOROS_USERS_JSON = JSON.stringify([
    { username: 'operatoros', password: 'owner-pass', role: 'owner' },
    { username: 'reviewer', password: 'reviewer-pass', role: 'reviewer' },
  ])
  delete process.env.OWNER_PASSWORD

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

    if (previousUsers === undefined) {
      delete process.env.OPERATOROS_USERS_JSON
    } else {
      process.env.OPERATOROS_USERS_JSON = previousUsers
    }

    if (previousOwnerPassword === undefined) {
      delete process.env.OWNER_PASSWORD
    } else {
      process.env.OWNER_PASSWORD = previousOwnerPassword
    }

    await rm(tempDir, { recursive: true, force: true })
  }
}

test('project data is persisted into normalized sqlite tables', async () => {
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
    const projectCount = db.prepare('SELECT COUNT(*) AS count FROM projects').get() as { count: number }
    const customerCount = db.prepare('SELECT COUNT(*) AS count FROM customers').get() as { count: number }
    const storedProject = db
      .prepare('SELECT id, public_token, quote_json, draft_html FROM projects WHERE id = ?')
      .get(result.project.id) as { id: string; public_token: string; quote_json: string; draft_html: string | null } | undefined
    db.close()

    assert.equal(projectCount.count, 1)
    assert.equal(customerCount.count, 1)
    assert.equal(storedProject?.id, result.project.id)
    assert.equal(storedProject?.public_token, result.project.publicToken)
    assert.match(storedProject?.quote_json ?? '', /"status":"ok"/)
    assert.ok(storedProject?.draft_html)
  })
})

test('owner session cookie carries identity and role for trusted owner requests', async () => {
  await withTempSqlitePath(async () => {
    const sessionValue = createOwnerSessionValue({ username: 'operatoros', role: 'owner' })
    const session = verifyOwnerSessionValue(sessionValue)

    assert.equal(session?.username, 'operatoros')
    assert.equal(session?.role, 'owner')
    assert.equal(getSessionFromCookieHeader(`operatoros_owner_session=${sessionValue}`)?.role, 'owner')

    const request = new Request('http://operatoros.test/api/projects/123/actions', {
      method: 'POST',
      headers: {
        cookie: `operatoros_owner_session=${sessionValue}`,
        origin: 'http://operatoros.test',
        host: 'operatoros.test',
      },
    })

    assert.doesNotThrow(() => requireOwnerRequest(request))
    assert.doesNotThrow(() => requireRole(request, ['owner']))
  })
})

test('reviewer role cannot perform owner-only project actions', async () => {
  await withTempSqlitePath(async () => {
    const sessionValue = createOwnerSessionValue({ username: 'reviewer', role: 'reviewer' })

    const request = new Request('http://operatoros.test/api/projects/123/actions', {
      method: 'POST',
      headers: {
        cookie: `operatoros_owner_session=${sessionValue}`,
        origin: 'http://operatoros.test',
        host: 'operatoros.test',
      },
    })

    assert.throws(() => requireRole(request, ['owner', 'operator']), /Insufficient permissions/)
  })
})

test('owner session cookie is rejected when missing or tampered', async () => {
  await withTempSqlitePath(async () => {
    const sessionValue = createOwnerSessionValue({ username: 'operatoros', role: 'owner' })

    assert.equal(verifyOwnerSessionValue(`${sessionValue}tampered`), null)

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
})
