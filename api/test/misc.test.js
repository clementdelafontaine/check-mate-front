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

test('add recipe to list honors itemIds selection', async () => {
  const recipeRes = await alice.json('POST', '/api/recipes', {
    name: 'SelectRecipe',
    sections: [
      {
        name: 'Frais',
        items: [
          { label: 'Beurre', quantity: '100 g' },
          { label: 'Œufs', quantity: '2' }
        ]
      }
    ]
  })
  assert.equal(recipeRes.status, 201)
  const section = recipeRes.data.sections[0]
  const listRes = await alice.json('POST', '/api/lists', { name: 'SelList', type: 'grocery' })
  const res = await alice.json('POST', `/api/recipes/${recipeRes.data.id}/add-to-list`, {
    listId: listRes.data.id,
    itemIds: [section.items[0].id]
  })
  assert.equal(res.status, 201)
  const after = await alice.json('GET', `/api/lists/${listRes.data.id}`)
  const labels = after.data.sections.flatMap((s) => s.items.map((i) => i.label))
  assert.deepEqual(labels.sort(), ['Beurre'])
})

test('recipe step toggle and reorder', async () => {
  const recipeRes = await alice.json('POST', '/api/recipes', {
    name: 'StepRecipe',
    steps: ['Première', 'Deuxième', 'Troisième']
  })
  assert.equal(recipeRes.status, 201)
  const steps = recipeRes.data.steps
  assert.equal(steps.length, 3)
  const toggle = await alice.json('PATCH', `/api/recipe-steps/${steps[0].id}`, { checked: true })
  assert.equal(toggle.status, 200)
  const afterToggle = await alice.json('GET', `/api/recipes/${recipeRes.data.id}`)
  assert.equal(afterToggle.data.steps[0].checked, true)
  const reorder = await alice.json('POST', `/api/recipes/${recipeRes.data.id}/steps/reorder`, {
    stepIds: [steps[2].id, steps[0].id, steps[1].id]
  })
  assert.equal(reorder.status, 200)
  const after = await alice.json('GET', `/api/recipes/${recipeRes.data.id}`)
  assert.deepEqual(after.data.steps.map((s) => s.text), ['Troisième', 'Première', 'Deuxième'])
  const del = await alice.json('DELETE', `/api/recipe-steps/${steps[1].id}`)
  assert.ok([200, 204].includes(del.status))
})

test('move item to another section at position', async () => {
  const listRes = await alice.json('POST', '/api/lists', { name: 'MoveList' })
  const s1 = listRes.data.sections[0]
  const s2 = await alice.json('POST', `/api/lists/${listRes.data.id}/sections`, { name: 'Rayon 2' })
  const i1 = await alice.json('POST', `/api/sections/${s1.id}/items`, { label: 'AAA' })
  const i2 = await alice.json('POST', `/api/sections/${s1.id}/items`, { label: 'BBB' })
  const moved = await alice.json('POST', `/api/items/${i2.data.id}/move`, {
    toSectionId: s2.data.id,
    position: 0
  })
  assert.equal(moved.status, 200)
  const after = await alice.json('GET', `/api/lists/${listRes.data.id}`)
  const rayon2 = after.data.sections.find((s) => s.name === 'Rayon 2')
  assert.deepEqual(rayon2.items.map((i) => i.label), ['BBB'])
  const movedBack = await alice.json('POST', `/api/items/${i2.data.id}/move`, {
    toSectionId: s1.id,
    position: 0
  })
  assert.equal(movedBack.status, 200)
  const after2 = await alice.json('GET', `/api/lists/${listRes.data.id}`)
  const divers = after2.data.sections.find((s) => s.name === 'Divers')
  assert.deepEqual(divers.items.map((i) => i.label), ['BBB', 'AAA'])
})

test('weekly recipes selection persists per user', async () => {
  const a = await alice.json('POST', '/api/recipes', { name: 'WeekRecipeA' })
  const b = await alice.json('POST', '/api/recipes', { name: 'WeekRecipeB' })
  const save = await alice.json('PUT', '/api/weekly-recipes', {
    recipeIds: [b.data.id, a.data.id]
  })
  assert.equal(save.status, 200)
  const ids = await alice.json('GET', '/api/weekly-recipes')
  assert.deepEqual(ids.data, [b.data.id, a.data.id])
  const replace = await alice.json('PUT', '/api/weekly-recipes', {
    recipeIds: [a.data.id]
  })
  assert.equal(replace.status, 200)
  const after = await alice.json('GET', '/api/weekly-recipes')
  assert.deepEqual(after.data, [a.data.id])
})

test('weekly recipes ignores recipes of another user', async () => {
  await createUser(app, { username: 'weekmallory' })
  const mallory = await login(app, 'weekmallory', 'password123')
  const own = await alice.json('POST', '/api/recipes', { name: 'AlicesWeek' })
  const save = await mallory.json('PUT', '/api/weekly-recipes', {
    recipeIds: [own.data.id]
  })
  assert.equal(save.status, 200)
  const ids = await mallory.json('GET', '/api/weekly-recipes')
  assert.deepEqual(ids.data, [])
})
