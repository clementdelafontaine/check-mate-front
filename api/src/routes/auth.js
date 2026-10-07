import { query, one, uid } from '../db.js'
import { verify } from '@node-rs/argon2'
import {
  authenticate,
  createSession,
  destroySession,
  publicUser,
  SESSION_COOKIE_NAME
} from '../auth.js'
import { hashPassword } from '../password.js'
import { seedDemoDataForUser } from '../seed.js'

export async function authRoutes(app) {
  app.get('/auth/me', async (req, reply) => {
    if (!req.user) return reply.code(401).send({ error: 'authentication required' })
    return publicUser(req.user)
  })

  app.post('/auth/login', async (req, reply) => {
    const { username, password } = req.body ?? {}
    if (!username || !password) {
      return reply.code(400).send({ error: 'username and password required' })
    }
    const user = await authenticate(String(username), String(password))
    if (!user) return reply.code(401).send({ error: 'invalid credentials' })
    await createSession(app, reply, user.id)
    return publicUser(user)
  })

  app.post('/auth/logout', async (req, reply) => {
    const sessionId = req.cookies?.[SESSION_COOKIE_NAME]
    if (sessionId) await destroySession(app, reply, sessionId)
    return { ok: true }
  })

  app.get('/auth/users', async (req, reply) => {
    if (req.user?.role !== 'admin') return reply.code(403).send({ error: 'admin only' })
    const { rows } = await query(
      'SELECT id, username, role, created_at FROM users ORDER BY created_at'
    )
    return rows
  })

  app.post('/auth/users', async (req, reply) => {
    if (req.user?.role !== 'admin') return reply.code(403).send({ error: 'admin only' })
    const { username, password, role = 'user' } = req.body ?? {}
    if (!username || !password) {
      return reply.code(400).send({ error: 'username and password required' })
    }
    const normalizedUsername = String(username).trim().toLowerCase()
    if (!/^[a-z0-9._-]{3,24}$/.test(normalizedUsername)) {
      return reply.code(400).send({ error: 'invalid username (3-24 chars, letters, digits, . _ -)' })
    }
    if (String(password).length < 8) {
      return reply.code(400).send({ error: 'password must be at least 8 characters' })
    }
    if (!['user', 'admin'].includes(role)) {
      return reply.code(400).send({ error: 'invalid role' })
    }
    const user = await one(
      `INSERT INTO users (id, username, password_hash, role) VALUES ($1, $2, $3, $4)
       RETURNING id, username, role, created_at`,
      [
        uid('u'),
        normalizedUsername,
        await hashPassword(String(password)),
        role
      ]
    ).catch(() => null)
    if (!user) return reply.code(409).send({ error: 'username already used' })
    try {
      const seeded = await seedDemoDataForUser(user.id)
      if (seeded) console.log(`demo data seeded for ${user.username}`)
    } catch (err) {
      console.error('seeding failed for new user', err.message)
    }
    return reply.code(201).send(user)
  })

  app.delete('/auth/users/:id', async (req, reply) => {
    if (req.user?.role !== 'admin') return reply.code(403).send({ error: 'admin only' })
    if (req.user.id === req.params.id) {
      return reply.code(400).send({ error: 'cannot delete yourself' })
    }
    const { rowCount } = await query('DELETE FROM users WHERE id = $1', [req.params.id])
    if (!rowCount) return reply.code(404).send({ error: 'not found' })
    return reply.code(204).send()
  })

  app.patch('/auth/me/password', async (req, reply) => {
    const { currentPassword, newPassword } = req.body ?? {}
    if (!currentPassword || !newPassword) {
      return reply.code(400).send({ error: 'currentPassword and newPassword required' })
    }
    if (String(newPassword).length < 8) {
      return reply.code(400).send({ error: 'password must be at least 8 characters' })
    }
    const ok = await verify(req.user.password_hash, String(currentPassword))
    if (!ok) return reply.code(401).send({ error: 'invalid current password' })
    await query('UPDATE users SET password_hash = $2 WHERE id = $1', [
      req.user.id,
      await hashPassword(String(newPassword))
    ])
    await query('DELETE FROM sessions WHERE user_id = $1', [req.user.id])
    return { ok: true }
  })

  app.patch('/auth/users/:id/password', async (req, reply) => {
    if (req.user?.role !== 'admin') return reply.code(403).send({ error: 'admin only' })
    const { password } = req.body ?? {}
    if (!password || String(password).length < 8) {
      return reply.code(400).send({ error: 'password must be at least 8 characters' })
    }
    const { rowCount } = await query(
      'UPDATE users SET password_hash = $2 WHERE id = $1',
      [req.params.id, await hashPassword(String(password))]
    )
    if (!rowCount) return reply.code(404).send({ error: 'not found' })
    await query('DELETE FROM sessions WHERE user_id = $1', [req.params.id])
    return { ok: true }
  })
}
