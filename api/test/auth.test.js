import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import {
  makeApp, resetDb, loginAdmin, login, createUser, makeUserClient
} from './helpers.js'

let app
let admin
let user

before(async () => {
  app = await makeApp()
  await resetDb()
  admin = await loginAdmin(app)
  user = await createUser(app, { username: 'authalice' })
})

after(async () => {
  await app.close()
})

test('health endpoint is public', async () => {
  const res = await app.inject({ method: 'GET', url: '/api/health' })
  assert.equal(res.statusCode, 200)
  assert.equal((await res.json()).status, 'ok')
})

test('protected routes reject anonymous access', async () => {
  for (const url of ['/api/lists', '/api/spaces', '/api/labels', '/api/templates', '/api/suggestions?q=x']) {
    const res = await app.inject({ method: 'GET', url })
    assert.equal(res.statusCode, 401, `${url} should require auth`)
  }
})

test('login with valid credentials returns user', async () => {
  const res = await app.inject({
    method: 'POST',
    url: '/api/auth/login',
    payload: { username: 'authalice', password: 'password123' }
  })
  assert.equal(res.statusCode, 200)
  const data = await res.json()
  assert.equal(data.username, 'authalice')
  assert.equal(data.role, 'user')
  assert.ok(res.headers['set-cookie'], 'session cookie should be set')
})

test('login with wrong password returns 401', async () => {
  const res = await app.inject({
    method: 'POST',
    url: '/api/auth/login',
    payload: { username: 'authalice', password: 'wrongpassword' }
  })
  assert.equal(res.statusCode, 401)
})

test('login with missing fields returns 400', async () => {
  const res = await app.inject({
    method: 'POST',
    url: '/api/auth/login',
    payload: { username: 'authalice' }
  })
  assert.equal(res.statusCode, 400)
})

test('auth/me returns current user', async () => {
  const client = await login(app, 'authalice', 'password123')
  const { status, data } = await client.json('GET', '/api/auth/me')
  assert.equal(status, 200)
  assert.equal(data.username, 'authalice')
})

test('logout destroys the session', async () => {
  const client = await login(app, 'authalice', 'password123')
  const { status } = await client.json('POST', '/api/auth/logout')
  assert.equal(status, 200)
  const after = await client.json('GET', '/api/auth/me')
  assert.equal(after.status, 401)
})

test('admin can list users', async () => {
  const { status, data } = await admin.json('GET', '/api/auth/users')
  assert.equal(status, 200)
  const names = data.map((u) => u.username)
  assert.ok(names.includes('admin'))
  assert.ok(names.includes('authalice'))
})

test('non-admin cannot list users', async () => {
  const client = await login(app, 'authalice', 'password123')
  const { status } = await client.json('GET', '/api/auth/users')
  assert.equal(status, 403)
})

test('admin can create a user with unique username', async () => {
  const { status, data } = await admin.json('POST', '/api/auth/users', {
    username: 'bob', password: 'password123', role: 'user'
  })
  assert.equal(status, 201)
  assert.equal(data.username, 'bob')
})

test('duplicate username is rejected with 409', async () => {
  const { status, data } = await admin.json('POST', '/api/auth/users', {
    username: 'bob', password: 'password123'
  })
  assert.equal(status, 409)
  assert.match(data.error, /already used/)
})

test('invalid username format is rejected', async () => {
  for (const bad of ['ab', 'has space', 'has@at', 'x'.repeat(25)]) {
    const { status } = await admin.json('POST', '/api/auth/users', {
      username: bad, password: 'password123'
    })
    assert.equal(status, 400, `username "${bad}" should be rejected`)
  }
})

test('short password is rejected', async () => {
  const { status } = await admin.json('POST', '/api/auth/users', {
    username: 'carl', password: 'short'
  })
  assert.equal(status, 400)
})

test('non-admin cannot create users', async () => {
  const client = await login(app, 'authalice', 'password123')
  const { status } = await client.json('POST', '/api/auth/users', {
    username: 'eve', password: 'password123'
  })
  assert.equal(status, 403)
})

test('user can change own password and must re-login', async () => {
  const client = await login(app, 'authalice', 'password123')
  console.error('DBG cookies', JSON.stringify(client.cookies))
  console.error('DBG me', JSON.stringify(await client.json('GET', '/api/auth/me')))
  const { status } = await client.json('PATCH', '/api/auth/me/password', {
    currentPassword: 'password123',
    newPassword: 'newpassword456'
  })
  assert.equal(status, 200)

  const oldSession = await client.json('GET', '/api/auth/me')
  assert.equal(oldSession.status, 401, 'old session should be invalidated')

  const reLogin = await login(app, 'authalice', 'newpassword456')
  assert.ok(reLogin, 'should login with new password')
})

test('password change with wrong current password fails', async () => {
  const client = await login(app, 'authalice', 'newpassword456')
  const { status } = await client.json('PATCH', '/api/auth/me/password', {
    currentPassword: 'wrongpassword',
    newPassword: 'anotherpass789'
  })
  assert.equal(status, 401)
})

test('admin can reset user password', async () => {
  const { status } = await admin.json('PATCH', `/api/auth/users/${user.id}/password`, {
    password: 'resetpass123'
  })
  assert.equal(status, 200)
  const client = await login(app, 'authalice', 'resetpass123')
  assert.ok(client)
})

test('admin cannot delete themselves', async () => {
  const { status } = await admin.json('DELETE', `/api/auth/users/${admin.username === 'admin' ? (await admin.json('GET', '/api/auth/me')).data.id : user.id}`)
  assert.equal(status, 400)
})

test('admin can delete a user', async () => {
  await admin.json('POST', '/api/auth/users', { username: 'temp', password: 'password123' })
  const list = await admin.json('GET', '/api/auth/users')
  const temp = list.data.find((u) => u.username === 'temp')
  const { status } = await admin.json('DELETE', `/api/auth/users/${temp.id}`)
  assert.equal(status, 204)
  const list2 = await admin.json('GET', '/api/auth/users')
  assert.ok(!list2.data.some((u) => u.username === 'temp'))
})

test('non-admin cannot delete users', async () => {
  const client = await login(app, 'authalice', 'resetpass123')
  const { status } = await client.json('DELETE', `/api/auth/users/${user.id}`)
  assert.equal(status, 403)
})
