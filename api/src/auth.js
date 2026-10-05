import { verify } from '@node-rs/argon2'
import { randomBytes } from 'node:crypto'
import { query, one, uid } from './db.js'
import { hashPassword } from './password.js'

const SESSION_COOKIE = 'checkmate_session'
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000 // 30 days

const newSessionId = () => randomBytes(32).toString('hex')

export async function ensureAdmin(email, password) {
  const normalizedEmail = String(email).trim().toLowerCase()
  const existing = await one('SELECT * FROM users WHERE email = $1', [normalizedEmail])
  if (existing) return existing
  const user = await one(
    `INSERT INTO users (id, email, username, password_hash, role) VALUES ($1, $2, $3, $4, 'admin') RETURNING *`,
    [uid('u'), normalizedEmail, normalizedEmail.split('@')[0], await hashPassword(password)]
  )
  return user
}

export async function authenticate(identifier, password) {
  const user = await one(
    'SELECT * FROM users WHERE username = $1 OR email = $1',
    [String(identifier).trim().toLowerCase()]
  )
  if (!user) return null
  const ok = await verify(user.password_hash, password)
  return ok ? user : null
}

export function createSession(app, reply, userId) {
  const sessionId = newSessionId()
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS)
  query('INSERT INTO sessions (id, user_id, expires_at) VALUES ($1, $2, $3)', [
    sessionId,
    userId,
    expiresAt
  ])
  reply.setCookie(SESSION_COOKIE, sessionId, {
    path: '/',
    httpOnly: true,
    sameSite: 'strict',
    secure: (process.env.COOKIE_SECURE ?? '') === 'true',
    expires: expiresAt
  })
  return sessionId
}

export function destroySession(app, reply, sessionId) {
  query('DELETE FROM sessions WHERE id = $1', [sessionId])
  reply.clearCookie(SESSION_COOKIE, { path: '/' })
}

export async function userFromSession(app, req) {
  const sessionId = req.cookies?.[SESSION_COOKIE]
  if (!sessionId) return null
  const session = await one(
    `DELETE FROM sessions WHERE id = $1 AND expires_at < now()
     RETURNING user_id`,
    [sessionId]
  )
  if (session) return null
  const row = await one(
    `SELECT u.* FROM users u
     JOIN sessions s ON s.user_id = u.id
     WHERE s.id = $1 AND s.expires_at > now()`,
    [sessionId]
  )
  return row ?? null
}

export function publicUser(user) {
  return user
    ? { id: user.id, username: user.username, email: user.email, role: user.role, createdAt: user.created_at }
    : null
}

export const SESSION_COOKIE_NAME = SESSION_COOKIE
