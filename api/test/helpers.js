import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import pg from 'pg'
import { hash as argonHash } from '@node-rs/argon2'
import { buildApp } from '../src/app.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const MIGRATIONS_DIR = path.join(__dirname, '..', 'src', 'migrations')

export const TEST_DB_URL =
  process.env.TEST_DATABASE_URL ??
  'postgres://checkmate:checkmate@localhost:5432/checkmate_test'

let migrationsRun = false

export async function runMigrations(connectionString = TEST_DB_URL) {
  if (migrationsRun) return
  const client = new pg.Client({ connectionString })
  await client.connect()
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `)
    const { rows } = await client.query('SELECT id FROM schema_migrations')
    const applied = new Set(rows.map((r) => r.id))
    const files = readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith('.sql')).sort()
    for (const file of files) {
      if (applied.has(file)) continue
      const sql = readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8')
      await client.query('BEGIN')
      try {
        await client.query(sql)
        await client.query('INSERT INTO schema_migrations (id) VALUES ($1)', [file])
        await client.query('COMMIT')
      } catch (err) {
        await client.query('ROLLBACK')
        throw err
      }
    }
    migrationsRun = true
  } finally {
    await client.end()
  }
}

export async function resetDb(connectionString = TEST_DB_URL) {
  const client = new pg.Client({ connectionString })
  await client.connect()
  try {
    await client.query(`
      TRUNCATE list_labels, items, sections, lists, template_items, template_sections,
               templates, labels, spaces, sessions, item_frequency, users
      RESTART IDENTITY CASCADE
    `)
  } finally {
    await client.end()
  }
}

export async function makeApp() {
  await runMigrations()
  return buildApp()
}

let userSeq = 0

export function makeUserClient(app, { username, password = 'password123', role = 'user' } = {}) {
  userSeq += 1
  const name = username ?? `user${userSeq}`
  const client = {
    username: name,
    password,
    cookies: [],
    async inject(method, url, body = null) {
      const res = await app.inject({
        method,
        url,
        payload: body === null ? undefined : body,
        cookies: Object.fromEntries(
          client.cookies.map((c) => [c.name, c.value])
        )
      })
      const rawCookies = res.headers['set-cookie'] ?? []
      const setCookies = Array.isArray(rawCookies) ? rawCookies : [rawCookies]
      for (const raw of setCookies) {
        const [pair] = raw.split(';')
        const idx = pair.indexOf('=')
        const name2 = pair.slice(0, idx)
        const value = pair.slice(idx + 1)
        const existing = client.cookies.find((c) => c.name === name2)
        if (existing) existing.value = value
        else client.cookies.push({ name: name2, value })
      }
      return res
    },
    async json(method, url, body = null) {
      const res = await client.inject(method, url, body)
      let data = null
      if (res.statusCode !== 204 && res.body) {
        try {
          data = JSON.parse(res.body)
        } catch {
          data = null
        }
      }
      return { status: res.statusCode, data }
    }
  }
  return client
}

export async function createUser(app, { username, password = 'password123', role = 'user' } = {}) {
  const admin = await loginAdmin(app)
  const res = await admin.json('POST', '/api/auth/users', { username, password, role })
  if (res.status !== 201) throw new Error(`failed to create user: ${JSON.stringify(res)}`)
  return { id: res.data.id, username: res.data.username, password, role: res.data.role }
}

export async function login(app, username, password) {
  const client = makeUserClient(app, { username, password })
  const res = await client.json('POST', '/api/auth/login', { username, password })
  if (res.status !== 200) throw new Error(`login failed: ${JSON.stringify(res)}`)
  return client
}

export async function loginAdmin(app) {
  const admin = await directCreateAdmin(app)
  return login(app, admin.username, admin.password)
}

export async function directCreateAdmin(app) {
  const client = new pg.Client({ connectionString: TEST_DB_URL })
  await client.connect()
  try {
    const { rows } = await client.query(
      `INSERT INTO users (id, email, username, password_hash, role)
       VALUES ($1, $2, $3, $4, 'admin')
       ON CONFLICT (username) DO UPDATE SET role = 'admin'
       RETURNING id, username`,
      [
        'u-test-admin',
        'admin@test.local',
        'admin',
        await hashTestPassword('adminpass123')
      ]
    )
    return { id: rows[0].id, username: rows[0].username, password: 'adminpass123' }
  } finally {
    await client.end()
  }
}

export async function hashTestPassword(password) {
  return argonHash(password)
}
