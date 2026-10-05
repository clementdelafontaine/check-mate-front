import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { makeApp, resetDb, login, createUser } from './helpers.js'

let app
let alice
let bob

before(async () => {
  app = await makeApp()
  await resetDb()
  await createUser(app, { username: 'friendsalice' })
  await createUser(app, { username: 'friendsbob' })
  await createUser(app, { username: 'friendscarl' })
  alice = await login(app, 'friendsalice', 'password123')
  bob = await login(app, 'friendsbob', 'password123')
})

after(async () => {
  await app.close()
})

test('friend request lifecycle', async () => {
  const sent = await alice.json('POST', '/api/friends', { username: 'friendsbob' })
  assert.equal(sent.status, 201)
  assert.equal(sent.data.status, 'pending')
  assert.equal(sent.data.direction, 'outgoing')

  const selfBefriend = await alice.json('POST', '/api/friends', { username: 'friendsalice' })
  assert.equal(selfBefriend.status, 400)

  const unknown = await alice.json('POST', '/api/friends', { username: 'nobody' })
  assert.equal(unknown.status, 404)

  const duplicate = await alice.json('POST', '/api/friends', { username: 'friendsbob' })
  assert.equal(duplicate.status, 409)

  const bobSees = await bob.json('GET', '/api/friends')
  const incoming = bobSees.data.find((f) => f.username === 'friendsalice')
  assert.equal(incoming.status, 'pending')
  assert.equal(incoming.direction, 'incoming')

  const accepted = await bob.json('POST', `/api/friends/${incoming.id}/accept`)
  assert.equal(accepted.status, 200)
  assert.equal(accepted.data.status, 'accepted')

  const aliceList = await alice.json('GET', '/api/friends')
  assert.ok(aliceList.data.some((f) => f.username === 'friendsbob' && f.status === 'accepted'))

  const reRequest = await alice.json('POST', '/api/friends', { username: 'friendsbob' })
  assert.equal(reRequest.status, 409)
})

test('accepting a request you did not receive fails', async () => {
  const carl = await login(app, 'friendscarl', 'password123')
  const res = await carl.json('POST', '/api/friends/unknown/accept')
  assert.equal(res.status, 404)
})

test('sharing requires friendship', async () => {
  const list = await alice.json('POST', '/api/lists', { name: 'Shared' })
  const carl = await login(app, 'friendscarl', 'password123')
  const carlMe = await carl.json('GET', '/api/auth/me')
  const res = await alice.json('POST', `/api/lists/${list.data.id}/collaborators`, {
    userId: carlMe.data.id
  })
  assert.equal(res.status, 403)
})

test('owner can share a list with a friend and friend sees it', async () => {
  const list = await alice.json('POST', '/api/lists', { name: 'Collab' })
  const bobMe = await bob.json('GET', '/api/auth/me')
  const shared = await alice.json('POST', `/api/lists/${list.data.id}/collaborators`, {
    userId: bobMe.data.id
  })
  assert.equal(shared.status, 201)

  const bobLists = await bob.json('GET', '/api/shared-lists')
  assert.ok(bobLists.data.some((l) => l.id === list.data.id))
  assert.equal(bobLists.data.find((l) => l.id === list.data.id).ownerUsername, 'friendsalice')

  const bobList = await bob.json('GET', `/api/lists/${list.data.id}`)
  assert.equal(bobList.status, 200)
  assert.equal(bobList.data.name, 'Collab')
})

test('collaborator can toggle and add items', async () => {
  const list = await bob.json('GET', '/api/shared-lists')
  const target = list.data[0]
  const section = target.sections[0]

  const item = await bob.json('POST', `/api/sections/${section.id}/items`, {
    label: 'Sel'
  })
  assert.equal(item.status, 201)

  const toggled = await bob.json('PATCH', `/api/items/${item.data.id}`, { checked: true })
  assert.equal(toggled.status, 200)
  assert.equal(toggled.data.checked, true)

  const aliceView = await alice.json('GET', `/api/lists/${target.id}`)
  const labels = aliceView.data.sections.flatMap((s) => s.items.map((i) => i.label))
  assert.ok(labels.includes('Sel'))
})

test('collaborator cannot rename or delete the list', async () => {
  const list = await bob.json('GET', '/api/shared-lists')
  const target = list.data[0]

  const rename = await bob.json('PATCH', `/api/lists/${target.id}`, { name: 'Hacked' })
  assert.equal(rename.status, 404)

  const del = await bob.json('DELETE', `/api/lists/${target.id}`)
  assert.equal(del.status, 404)
})

test('versions endpoint reports updated_at changes', async () => {
  const list = await alice.json('POST', '/api/lists', { name: 'Versioned' })
  const before = await alice.json('GET', '/api/lists/versions')
  const beforeRow = before.data.find((v) => v.id === list.data.id)

  await new Promise((r) => setTimeout(r, 50))
  const section = await alice.json('GET', `/api/lists/${list.data.id}`)
  await alice.json('POST', `/api/sections/${section.data.sections[0].id}/items`, { label: 'X' })

  const after = await alice.json('GET', '/api/lists/versions')
  const afterRow = after.data.find((v) => v.id === list.data.id)
  assert.ok(beforeRow.updatedAt < afterRow.updatedAt)
})

test('friend removal revokes access to shared list', async () => {
  const friends = await alice.json('GET', '/api/friends')
  const friendship = friends.data.find((f) => f.username === 'friendsbob')
  const removed = await alice.json('DELETE', `/api/friends/${friendship.id}`)
  assert.equal(removed.status, 204)

  const bobLists = await bob.json('GET', '/api/shared-lists')
  assert.equal(bobLists.data.length, 0)

  const list = await bob.json('GET', '/api/shared-lists')
  const stillThere = await alice.json('POST', '/api/lists', { name: 'After' })
  const shareAttempt = await alice.json('POST', `/api/lists/${stillThere.data.id}/collaborators`, {
    userId: (await bob.json('GET', '/api/auth/me')).data.id
  })
  assert.equal(shareAttempt.status, 403)
})

test('non-collaborator cannot access a shared list', async () => {
  const carl = await login(app, 'friendscarl', 'password123')
  const aliceLists = await alice.json('GET', '/api/lists')
  const anyList = aliceLists.data[0]
  if (!anyList) return
  const res = await carl.json('GET', `/api/lists/${anyList.id}`)
  assert.ok([403, 404].includes(res.status))
})
