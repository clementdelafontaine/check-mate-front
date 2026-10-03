import { query } from '../db.js'

export async function suggestionsRoutes(app) {
  app.get('/suggestions', async (req) => {
    const prefix = String(req.query.prefix ?? '').trim().toLowerCase()
    if (!prefix) return []
    const limit = Math.min(Number(req.query.limit ?? 5) || 5, 20)
    const { rows } = await query(
      `SELECT label FROM item_frequency
       WHERE label LIKE $1 || '%'
       ORDER BY count DESC, label
       LIMIT $2`,
      [prefix, limit]
    )
    return rows.map((r) => r.label)
  })
}
