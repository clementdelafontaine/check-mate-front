import { query, one, uid } from '../db.js'

export async function labelsRoutes(app) {
  app.get('/labels', async () => {
    const { rows } = await query('SELECT * FROM labels ORDER BY created_at, id')
    return rows
  })

  app.post('/labels', async (req, reply) => {
    const { name, color = '#4d8dff' } = req.body ?? {}
    if (!name?.trim()) return reply.code(400).send({ error: 'name required' })
    const label = await one(
      'INSERT INTO labels (id, name, color) VALUES ($1, $2, $3) RETURNING *',
      [uid('lb'), name.trim(), color]
    )
    return reply.code(201).send(label)
  })

  app.delete('/labels/:id', async (req, reply) => {
    const { rowCount } = await query('DELETE FROM labels WHERE id = $1', [req.params.id])
    if (!rowCount) return reply.code(404).send({ error: 'not found' })
    return reply.code(204).send()
  })
}
