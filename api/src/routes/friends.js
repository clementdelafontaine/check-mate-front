import { query, one, uid, listWithSections } from '../db.js'

export async function friendsRoutes(app) {
  app.get('/friends', async (req) => {
    const { rows } = await query(
      `SELECT f.id, f.status, f.created_at, f.updated_at,
              CASE WHEN f.requester_id = $1 THEN f.addressee_id ELSE f.requester_id END AS other_id,
              CASE WHEN f.requester_id = $1 THEN 'outgoing' ELSE 'incoming' END AS direction
       FROM friendships f
       WHERE f.requester_id = $1 OR f.addressee_id = $1`,
      [req.user.id]
    )
    if (!rows.length) return []
    const users = await query(
      `SELECT id, username FROM users WHERE id = ANY($1::text[])`,
      [rows.map((r) => r.other_id)]
    )
    const nameById = new Map(users.rows.map((u) => [u.id, u.username]))
    return rows.map((r) => ({
      id: r.id,
      status: r.status,
      direction: r.direction,
      userId: r.other_id,
      username: nameById.get(r.other_id),
      createdAt: r.created_at,
      updatedAt: r.updated_at
    }))
  })

  app.post('/friends', async (req, reply) => {
    const { username } = req.body ?? {}
    if (!username?.trim()) {
      return reply.code(400).send({ error: 'username required' })
    }
    const target = await one(
      'SELECT id, username FROM users WHERE username = $1',
      [String(username).trim().toLowerCase()]
    )
    if (!target) return reply.code(404).send({ error: 'user not found' })
    if (target.id === req.user.id) {
      return reply.code(400).send({ error: 'cannot befriend yourself' })
    }
    const existing = await one(
      `SELECT * FROM friendships
       WHERE (requester_id = $1 AND addressee_id = $2)
          OR (requester_id = $2 AND addressee_id = $1)`,
      [req.user.id, target.id]
    )
    if (existing) {
      if (existing.status === 'accepted') {
        return reply.code(409).send({ error: 'already friends' })
      }
      return reply.code(409).send({ error: 'request already pending' })
    }
    const friendship = await one(
      `INSERT INTO friendships (id, requester_id, addressee_id)
       VALUES ($1, $2, $3) RETURNING *`,
      [uid('f'), req.user.id, target.id]
    )
    return reply.code(201).send({
      id: friendship.id,
      status: friendship.status,
      direction: 'outgoing',
      userId: target.id,
      username: target.username
    })
  })

  app.post('/friends/:id/accept', async (req, reply) => {
    const friendship = await one(
      `UPDATE friendships SET status = 'accepted', updated_at = now()
       WHERE id = $1 AND addressee_id = $2 AND status = 'pending'
       RETURNING *`,
      [req.params.id, req.user.id]
    )
    if (!friendship) return reply.code(404).send({ error: 'not found' })
    return { id: friendship.id, status: friendship.status }
  })

  app.delete('/friends/:id', async (req, reply) => {
    const friendship = await one(
      `SELECT * FROM friendships
       WHERE id = $1 AND (requester_id = $2 OR addressee_id = $2)`,
      [req.params.id, req.user.id]
    )
    if (!friendship) return reply.code(404).send({ error: 'not found' })
    await query('DELETE FROM friendships WHERE id = $1', [req.params.id])
    await query(
      `DELETE FROM list_collaborators lc
       USING lists l
       WHERE lc.list_id = l.id
         AND lc.user_id IN ($1, $2)
         AND l.user_id IN ($1, $2)
         AND lc.user_id <> l.user_id`,
      [friendship.requester_id, friendship.addressee_id]
    )
    return reply.code(204).send()
  })

  app.get('/lists/:id/collaborators', async (req, reply) => {
    const list = await one('SELECT id FROM lists WHERE id = $1 AND user_id = $2', [
      req.params.id,
      req.user.id
    ])
    if (!list) return reply.code(404).send({ error: 'list not found' })
    const { rows } = await query(
      `SELECT lc.user_id, u.username FROM list_collaborators lc
       JOIN users u ON u.id = lc.user_id
       WHERE lc.list_id = $1`,
      [req.params.id]
    )
    return rows.map((r) => ({ userId: r.user_id, username: r.username }))
  })

  app.post('/lists/:id/collaborators', async (req, reply) => {
    const { userId } = req.body ?? {}
    if (!userId) return reply.code(400).send({ error: 'userId required' })
    const list = await one('SELECT id FROM lists WHERE id = $1 AND user_id = $2', [
      req.params.id,
      req.user.id
    ])
    if (!list) return reply.code(404).send({ error: 'list not found' })
    const friend = await one(
      `SELECT 1 FROM friendships
       WHERE status = 'accepted'
         AND ((requester_id = $1 AND addressee_id = $2)
           OR (requester_id = $2 AND addressee_id = $1))`,
      [req.user.id, userId]
    )
    if (!friend) return reply.code(403).send({ error: 'not a friend' })
    await query(
      `INSERT INTO list_collaborators (list_id, user_id) VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [req.params.id, userId]
    )
    await query('UPDATE lists SET updated_at = now() WHERE id = $1', [req.params.id])
    return reply.code(201).send({ ok: true })
  })

  app.delete('/lists/:id/collaborators/:userId', async (req, reply) => {
    const list = await one('SELECT id FROM lists WHERE id = $1 AND user_id = $2', [
      req.params.id,
      req.user.id
    ])
    if (!list) return reply.code(404).send({ error: 'list not found' })
    const { rowCount } = await query(
      'DELETE FROM list_collaborators WHERE list_id = $1 AND user_id = $2',
      [req.params.id, req.params.userId]
    )
    if (!rowCount) return reply.code(404).send({ error: 'not found' })
    await query('UPDATE lists SET updated_at = now() WHERE id = $1', [req.params.id])
    return reply.code(204).send()
  })

  app.get('/shared-lists', async (req) => {
    const { rows } = await query(
      `SELECT l.id FROM lists l
       JOIN list_collaborators lc ON lc.list_id = l.id
       WHERE lc.user_id = $1
       ORDER BY l.updated_at DESC`,
      [req.user.id]
    )
    const lists = await Promise.all(rows.map((r) => listWithSections(r.id)))
    const ownerIds = [...new Set(lists.map((l) => l.user_id).filter(Boolean))]
    const owners = ownerIds.length
      ? (await query('SELECT id, username FROM users WHERE id = ANY($1::text[])', [ownerIds])).rows
      : []
    const nameById = new Map(owners.map((u) => [u.id, u.username]))
    return lists.map((l) => ({ ...l, ownerUsername: nameById.get(l.user_id) ?? null }))
  })

  app.get('/lists/versions', async (req) => {
    const { rows } = await query(
      `SELECT l.id, l.updated_at FROM lists l
       WHERE l.user_id = $1
          OR l.id IN (SELECT list_id FROM list_collaborators WHERE user_id = $1)`,
      [req.user.id]
    )
    return rows.map((r) => ({ id: r.id, updatedAt: r.updated_at }))
  })
}
