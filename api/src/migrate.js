import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import pg from 'pg'
import { config } from './config.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const MIGRATIONS_DIR = path.join(__dirname, 'migrations')

async function main() {
  let client = null
  for (let attempt = 1; attempt <= 30; attempt++) {
    client = new pg.Client({ connectionString: config.databaseUrl })
    try {
      await client.connect()
      break
    } catch (err) {
      console.log(`waiting for database (${attempt}/30): ${err.message}`)
      try { await client.end() } catch {}
      if (attempt === 30) throw new Error('could not connect to the database')
      await new Promise((r) => setTimeout(r, 2000))
    }
  }
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `)
    const { rows } = await client.query('SELECT id FROM schema_migrations')
    const applied = new Set(rows.map((r) => r.id))
    const files = readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith('.sql'))
      .sort()
    for (const file of files) {
      if (applied.has(file)) continue
      const sql = readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8')
      console.log(`applying ${file}`)
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
    console.log('migrations up to date')
  } finally {
    await client.end()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
