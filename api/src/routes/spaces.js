import { query, one, uid } from '../db.js'

export async function spacesRoutes(app) {
  app.get('/spaces', async () => {
    const { rows } = await query('SELECT * FROM spaces ORDER BY created_at, id')
    return rows
  })

  app.post('/spaces', async (req, reply) => {
    const { name, emoji = '📁' } = req.body ?? {}
    if (!name?.trim()) return reply.code(400).send({ error: 'name required' })
    const space = await one(
      'INSERT INTO spaces (id, name, emoji) VALUES ($1, $2, $3) RETURNING *',
      [uid('sp'), name.trim(), emoji]
    )
    return reply.code(201).send(space)
  })

  app.patch('/spaces/:id', async (req, reply) => {
    const { name } = req.body ?? {}
    if (!name?.trim()) return reply.code(400).send({ error: 'name required' })
    const space = await one('UPDATE spaces SET name = $2 WHERE id = $1 RETURNING *', [
      req.params.id,
      name.trim()
    ])
    if (!space) return reply.code(404).send({ error: 'not found' })
    return space
  })

  app.delete('/spaces/:id', async (req, reply) => {
    const { rowCount } = await query('DELETE FROM spaces WHERE id = $1', [req.params.id])
    if (!rowCount) return reply.code(404).send({ error: 'not found' })
    return reply.code(204).send()
  })
}
