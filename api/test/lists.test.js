import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { makeApp, resetDb, login, createUser } from './helpers.js'

let app
let alice

before(async () => {
  app = await makeApp()
  await resetDb()
  await createUser(app, { username: 'listsalice' })
  alice = await login(app, 'listsalice', 'password123')
})

after(async () => {
  await app.close()
})

async function createList(body) {
  return alice.json('POST', '/api/lists', body)
}

async function firstList() {
  const { data } = await alice.json('GET', '/api/lists')
  return data[0]
}

test('create a list returns 201 with default Divers section', async () => {
  const { status, data } = await createList({ name: 'Test' })
  assert.equal(status, 201)
  assert.equal(data.name, 'Test')
  assert.equal(data.sections.length, 1)
  assert.equal(data.sections[0].name, 'Divers')
  assert.deepEqual(data.sections[0].items, [])
})

test('create a list requires a name', async () => {
  const { status } = await createList({ name: '   ' })
  assert.equal(status, 400)
})

test('empty string dates are rejected by validation', async () => {
  const { status } = await createList({
    name: 'NoDate', startDate: '', endDate: ''
  })
  assert.equal(status, 400)
})

test('null dates are accepted', async () => {
  const { status, data } = await createList({
    name: 'NoDate', startDate: null, endDate: null
  })
  assert.equal(status, 201)
  assert.equal(data.start_date, null)
  assert.equal(data.end_date, null)
})

test('dates are returned as YYYY-MM-DD strings', async () => {
  const { status, data } = await createList({
    name: 'WithDate', startDate: '2030-05-10', endDate: '2030-05-20'
  })
  assert.equal(status, 201)
  assert.equal(String(data.start_date).slice(0, 10), '2030-05-10')
  assert.equal(String(data.end_date).slice(0, 10), '2030-05-20')
})

test('create a list in a space', async () => {
  const space = await alice.json('POST', '/api/spaces', { name: 'Courses' })
  const { status, data } = await createList({ name: 'InSpace', spaceId: space.data.id })
  assert.equal(status, 201)
  assert.equal(data.space_id, space.data.id)
})

test('create a list from a template copies sections and items', async () => {
  const tpl = await alice.json('POST', '/api/templates', { name: 'Tpl' })
  const section = await alice.json('POST', `/api/templates/${tpl.data.id}/sections`, { name: 'Épicerie' })
  await alice.json('POST', `/api/template-sections/${section.data.id}/items`, { label: 'Pâtes' })

  const { status, data } = await createList({ name: 'FromTpl', templateId: tpl.data.id })
  assert.equal(status, 201)
  assert.equal(data.sections.length, 1)
  assert.equal(data.sections[0].name, 'Épicerie')
  assert.equal(data.sections[0].items.length, 1)
  assert.equal(data.sections[0].items[0].label, 'Pâtes')
})

test('get list by id', async () => {
  const created = await createList({ name: 'GetMe' })
  const { status, data } = await alice.json('GET', `/api/lists/${created.data.id}`)
  assert.equal(status, 200)
  assert.equal(data.name, 'GetMe')
})

test('get unknown list returns 404', async () => {
  const { status } = await alice.json('GET', '/api/lists/does-not-exist')
  assert.equal(status, 404)
})

test('update list name and dates', async () => {
  const created = await createList({ name: 'Upd' })
  const { status, data } = await alice.json('PATCH', `/api/lists/${created.data.id}`, {
    name: 'Updated', startDate: '2030-01-15'
  })
  assert.equal(status, 200)
  assert.equal(data.name, 'Updated')
  assert.equal(String(data.start_date).slice(0, 10), '2030-01-15')
})

test('update can clear dates back to null', async () => {
  const created = await createList({ name: 'ClearDate', startDate: '2030-01-15' })
  const { status, data } = await alice.json('PATCH', `/api/lists/${created.data.id}`, {
    startDate: null
  })
  assert.equal(status, 200)
  assert.equal(data.start_date, null)
})

test('delete list returns 204 and removes it', async () => {
  const created = await createList({ name: 'DelMe' })
  const { status } = await alice.json('DELETE', `/api/lists/${created.data.id}`)
  assert.equal(status, 204)
  const after = await alice.json('GET', `/api/lists/${created.data.id}`)
  assert.equal(after.status, 404)
})

test('duplicate copies sections, items and dates', async () => {
  const space = await alice.json('POST', '/api/spaces', { name: 'Sp2' })
  const created = await createList({ name: 'Orig', spaceId: space.data.id, startDate: '2030-02-01' })
  const section = await alice.json('POST', `/api/lists/${created.data.id}/sections`, { name: 'Sec' })
  await alice.json('POST', `/api/sections/${section.data.id}/items`, { label: 'Item' })

  const { status, data } = await alice.json('POST', `/api/lists/${created.data.id}/duplicate`)
  assert.equal(status, 201)
  assert.equal(data.name, 'Orig (copie)')
  assert.equal(data.space_id, space.data.id)
  assert.equal(String(data.start_date).slice(0, 10), '2030-02-01')
  assert.equal(data.sections.length, 2)
  const sec = data.sections.find((s) => s.name === 'Sec')
  assert.equal(sec.items.length, 1)
  assert.equal(sec.items[0].checked, false)
})

test('convert list to template', async () => {
  const created = await createList({ name: 'ToTpl' })
  const { status, data } = await alice.json('POST', `/api/lists/${created.data.id}/template`)
  assert.equal(status, 201)
  const tpl = await alice.json('GET', `/api/templates/${data.id}`)
  assert.equal(tpl.status, 200)
})

test('sections CRUD', async () => {
  const created = await createList({ name: 'Sections' })
  const { status, data } = await alice.json('POST', `/api/lists/${created.data.id}/sections`, { name: 'Rayon' })
  assert.equal(status, 201)
  assert.equal(data.name, 'Rayon')

  const { status: nf } = await alice.json('POST', '/api/lists/unknown/sections', { name: 'X' })
  assert.equal(nf, 404)
})

test('items CRUD and toggle', async () => {
  const list = await createList({ name: 'Items' })
  const section = await alice.json('POST', `/api/lists/${list.data.id}/sections`, { name: 'S' })
  const item = await alice.json('POST', `/api/sections/${section.data.id}/items`, {
    label: 'Lait', quantity: '2'
  })
  assert.equal(item.status, 201)
  assert.equal(item.data.label, 'Lait')
  assert.equal(item.data.quantity, '2')

  const noLabel = await alice.json('POST', `/api/sections/${section.data.id}/items`, { label: '  ' })
  assert.equal(noLabel.status, 400)

  const patch = await alice.json('PATCH', `/api/items/${item.data.id}`, { checked: true })
  assert.equal(patch.status, 200)
  assert.equal(patch.data.checked, true)

  const secondSection = await alice.json('POST', `/api/lists/${list.data.id}/sections`, { name: 'S2' })
  const moved = await alice.json('POST', `/api/items/${item.data.id}/move`, { toSectionId: secondSection.data.id })
  assert.ok([200, 204].includes(moved.status))
  const afterMove = await alice.json('GET', `/api/lists/${list.data.id}`)
  const inSecond = afterMove.data.sections.find((s) => s.id === secondSection.data.id)
  assert.ok(inSecond.items.some((i) => i.id === item.data.id))

  const del = await alice.json('DELETE', `/api/items/${item.data.id}`)
  assert.ok([200, 204].includes(del.status))
})

test('clear-checked empties checked items only', async () => {
  const list = await createList({ name: 'Clear' })
  const section = await alice.json('POST', `/api/lists/${list.data.id}/sections`, { name: 'S' })
  const a = await alice.json('POST', `/api/sections/${section.data.id}/items`, { label: 'a' })
  const b = await alice.json('POST', `/api/sections/${section.data.id}/items`, { label: 'b' })
  await alice.json('PATCH', `/api/items/${a.data.id}`, { checked: true })

  const { status, data } = await alice.json('POST', `/api/lists/${list.data.id}/clear-checked`)
  assert.ok([200, 204].includes(status))
  const after = await alice.json('GET', `/api/lists/${list.data.id}`)
  const labels = after.data.sections.flatMap((s) => s.items.map((i) => i.label))
  assert.deepEqual(labels, ['b'])
  assert.ok(after.data.sections.some((s) => s.items.some((i) => i.id === b.data.id)))
})

test('reset unchecks all items', async () => {
  const list = await createList({ name: 'Reset' })
  const section = await alice.json('POST', `/api/lists/${list.data.id}/sections`, { name: 'S' })
  const a = await alice.json('POST', `/api/sections/${section.data.id}/items`, { label: 'a' })
  await alice.json('PATCH', `/api/items/${a.data.id}`, { checked: true })

  const { status } = await alice.json('POST', `/api/lists/${list.data.id}/reset`)
  assert.ok([200, 204].includes(status))
  const after = await alice.json('GET', `/api/lists/${list.data.id}`)
  const items = after.data.sections.flatMap((s) => s.items)
  assert.ok(items.length > 0)
  assert.ok(items.every((i) => !i.checked))
})

test('labels toggle on list', async () => {
  const label = await alice.json('POST', '/api/labels', { name: 'Urgent' })
  const list = await createList({ name: 'Labeled' })
  const on = await alice.json('POST', `/api/lists/${list.data.id}/labels/${label.data.id}/toggle`)
  assert.ok([200, 204].includes(on.status))
  const after = await alice.json('GET', `/api/lists/${list.data.id}`)
  assert.deepEqual(after.data.labelIds, [label.data.id])
  await alice.json('POST', `/api/lists/${list.data.id}/labels/${label.data.id}/toggle`)
  const off = await alice.json('GET', `/api/lists/${list.data.id}`)
  assert.deepEqual(off.data.labelIds, [])
})

test('update with unknown label id returns 400', async () => {
  const list = await createList({ name: 'BadLabel' })
  const { status } = await alice.json('PATCH', `/api/lists/${list.data.id}`, {
    labelIds: ['lb-unknown']
  })
  assert.equal(status, 400)
})

test('list isolation between users', async () => {
  await createUser(app, { username: 'listsmallory' })
  const mallory = await login(app, 'listsmallory', 'password123')
  const list = await createList({ name: 'AlicesPrivate' })
  const { status } = await mallory.json('GET', `/api/lists/${list.data.id}`)
  assert.equal(status, 404)
  const patch = await mallory.json('PATCH', `/api/lists/${list.data.id}`, { name: 'Stolen' })
  assert.equal(patch.status, 404)
})
