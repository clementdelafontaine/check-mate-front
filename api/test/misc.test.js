import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { makeApp, resetDb, login, createUser } from './helpers.js'

let app
let alice

before(async () => {
  app = await makeApp()
  await resetDb()
  await createUser(app, { username: 'miscaalice' })
  alice = await login(app, 'miscaalice', 'password123')
})

after(async () => {
  await app.close()
})

test('spaces CRUD', async () => {
  const created = await alice.json('POST', '/api/spaces', { name: 'Maison', emoji: '🏠' })
  assert.equal(created.status, 201)
  assert.equal(created.data.name, 'Maison')

  const empty = await alice.json('POST', '/api/spaces', { name: ' ' })
  assert.equal(empty.status, 400)

  const list = await alice.json('GET', '/api/spaces')
  assert.ok(list.data.some((s) => s.name === 'Maison'))

  const renamed = await alice.json('PATCH', `/api/spaces/${created.data.id}`, { name: 'Home' })
  assert.equal(renamed.status, 200)
  assert.equal(renamed.data.name, 'Home')

  const notFound = await alice.json('PATCH', '/api/spaces/unknown', { name: 'X' })
  assert.equal(notFound.status, 404)

  const del = await alice.json('DELETE', `/api/spaces/${created.data.id}`)
  assert.equal(del.status, 204)
  const after = await alice.json('GET', '/api/spaces')
  assert.ok(!after.data.some((s) => s.id === created.data.id))
})

test('deleting a space nullifies list space_id', async () => {
  const space = await alice.json('POST', '/api/spaces', { name: 'Vanish' })
  const list = await alice.json('POST', '/api/lists', { name: 'L', spaceId: space.data.id })
  await alice.json('DELETE', `/api/spaces/${space.data.id}`)
  const after = await alice.json('GET', `/api/lists/${list.data.id}`)
  assert.equal(after.status, 200)
  assert.equal(after.data.space_id, null)
})

test('labels CRUD', async () => {
  const created = await alice.json('POST', '/api/labels', { name: 'Urgent', color: '#ff0000' })
  assert.equal(created.status, 201)

  const bad = await alice.json('POST', '/api/labels', { name: '' })
  assert.equal(bad.status, 400)

  const del = await alice.json('DELETE', `/api/labels/${created.data.id}`)
  assert.equal(del.status, 204)
  const nf = await alice.json('DELETE', `/api/labels/${created.data.id}`)
  assert.equal(nf.status, 404)
})

test('templates CRUD with sections and items', async () => {
  const tpl = await alice.json('POST', '/api/templates', { name: 'Courses type', description: 'Base' })
  assert.equal(tpl.status, 201)

  const bad = await alice.json('POST', '/api/templates', { name: ' ' })
  assert.equal(bad.status, 400)

  const section = await alice.json('POST', `/api/templates/${tpl.data.id}/sections`, { name: 'Frais' })
  assert.equal(section.status, 201)

  const nfSection = await alice.json('POST', '/api/templates/unknown/sections', { name: 'X' })
  assert.equal(nfSection.status, 404)

  const item = await alice.json('POST', `/api/template-sections/${section.data.id}/items`, {
    label: 'Œufs', kind: 'product', quantity: '6'
  })
  assert.equal(item.status, 201)

  const noLabel = await alice.json('POST', `/api/template-sections/${section.data.id}/items`, { label: '' })
  assert.equal(noLabel.status, 400)

  const detail = await alice.json('GET', `/api/templates/${tpl.data.id}`)
  assert.equal(detail.data.sections.length, 1)
  assert.equal(detail.data.sections[0].items[0].label, 'Œufs')

  const delItem = await alice.json('DELETE', `/api/template-items/${item.data.id}`)
  assert.ok([200, 204].includes(delItem.status))

  const del = await alice.json('DELETE', `/api/templates/${tpl.data.id}`)
  assert.equal(del.status, 204)
})

test('suggestions return frequent labels by prefix', async () => {
  const list = await alice.json('POST', '/api/lists', { name: 'Freq' })
  const section = await alice.json('POST', `/api/lists/${list.data.id}/sections`, { name: 'S' })
  await alice.json('POST', `/api/sections/${section.data.id}/items`, { label: 'Lait' })
  await alice.json('POST', `/api/sections/${section.data.id}/items`, { label: 'Lait' })

  const suggestions = await alice.json('GET', '/api/suggestions?prefix=la')
  assert.equal(suggestions.status, 200)
  assert.ok(suggestions.data.includes('lait'))

  const none = await alice.json('GET', '/api/suggestions?prefix=zz')
  assert.deepEqual(none.data, [])

  const emptyPrefix = await alice.json('GET', '/api/suggestions?prefix=')
  assert.deepEqual(emptyPrefix.data, [])
})

test('suggestions are isolated per user', async () => {
  await createUser(app, { username: 'miscbob' })
  const bob = await login(app, 'miscbob', 'password123')
  const res = await bob.json('GET', '/api/suggestions?prefix=la')
  assert.deepEqual(res.data, [])
})
