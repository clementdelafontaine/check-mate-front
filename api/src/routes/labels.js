import { query, one, uid } from '../db.js'

export async function labelsRoutes(app) {
  app.get('/labels', async (req) => {
    const { rows } = await query(
      'SELECT * FROM labels WHERE user_id = $1 ORDER BY created_at, id',
      [req.user.id]
    )
    return rows
  })

  app.post('/labels', async (req, reply) => {
    const { name, color = '#4d8dff' } = req.body ?? {}
    if (!name?.trim()) return reply.code(400).send({ error: 'name required' })
    const label = await one(
      'INSERT INTO labels (id, name, color, user_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [uid('lb'), name.trim(), color, req.user.id]
    )
    return reply.code(201).send(label)
  })

  app.delete('/labels/:id', async (req, reply) => {
    const { rowCount } = await query('DELETE FROM labels WHERE id = $1 AND user_id = $2', [
      req.params.id,
      req.user.id
    ])
    if (!rowCount) return reply.code(404).send({ error: 'not found' })
    return reply.code(204).send()
  })
}
