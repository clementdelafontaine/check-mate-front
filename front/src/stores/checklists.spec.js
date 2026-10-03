import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useChecklistsStore, GENERIC_SECTION } from './checklists'

const firstList = (store) => store.lists[0]

describe('checklists store', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('starts with mock lists and templates', async () => {
    const store = useChecklistsStore()
    expect(store.lists.length).toBeGreaterThan(0)
    expect(store.templates.length).toBeGreaterThan(0)
  })

  it('toggles items', async () => {
    const store = useChecklistsStore()
    const list = firstList(store)
    const section = list.sections[0]
    const item = section.items.find((i) => !i.checked)
    store.toggleItem(list.id, section.id, item.id)
    expect(item.checked).toBe(true)
    store.toggleItem(list.id, section.id, item.id)
    expect(item.checked).toBe(false)
  })

  it('adds items to the generic section when none provided', async () => {
    const store = useChecklistsStore()
    const list = firstList(store)
    const before = list.sections.length
    store.addItem(list.id, '', 'Nouveau')
    let divers = list.sections.find((s) => s.name === GENERIC_SECTION)
    if (!divers) {
      expect(list.sections.length).toBe(before + 1)
      divers = list.sections.find((s) => s.name === GENERIC_SECTION)
    }
    expect(divers.items.some((i) => i.label === 'Nouveau')).toBe(true)
  })

  it('removes an item and can restore it', async () => {
    const store = useChecklistsStore()
    const list = firstList(store)
    const section = list.sections[0]
    const item = section.items[0]
    const payload = await store.removeItem(list.id, section.id, item.id)
    expect(section.items.some((i) => i.id === item.id)).toBe(false)
    store.restoreItem(list.id, section.id, payload)
    expect(section.items.some((i) => i.id === item.id)).toBe(true)
  })

  it('clears checked items and restores them', async () => {
    const store = useChecklistsStore()
    const list = firstList(store)
    const section = list.sections[0]
    const item = section.items.find((i) => !i.checked)
    store.toggleItem(list.id, section.id, item.id)
    const checkedBefore = list.sections.flatMap((s) => s.items).filter((i) => i.checked).length
    const removed = await store.clearChecked(list.id)
    expect(removed.length).toBe(checkedBefore)
    expect(section.items.length).toBe(section.items.filter((i) => !i.checked).length)
    store.restoreCleared(list.id, removed)
    expect(section.items.some((i) => i.id === item.id)).toBe(true)
  })

  it('resets all checked states', async () => {
    const store = useChecklistsStore()
    const list = firstList(store)
    const section = list.sections[0]
    store.toggleItem(list.id, section.id, section.items[0].id)
    store.resetList(list.id)
    const anyChecked = list.sections.some((s) => s.items.some((i) => i.checked))
    expect(anyChecked).toBe(false)
  })

  it('creates a list from a template with unchecked items', async () => {
    const store = useChecklistsStore()
    const tpl = store.templates[0]
    const created = await store.createListFromTemplate(tpl.id, 'Ma liste')
    expect(created.name).toBe('Ma liste')
    const anyChecked = created.sections.some((s) => s.items.some((i) => i.checked))
    expect(anyChecked).toBe(false)
    const templateItemCount = tpl.sections.reduce((n, s) => n + s.items.length, 0)
    const createdItemCount = created.sections.reduce((n, s) => n + s.items.length, 0)
    expect(createdItemCount).toBe(templateItemCount)
  })

  it('duplicates a list', async () => {
    const store = useChecklistsStore()
    const list = firstList(store)
    const before = store.lists.length
    const copy = await store.duplicateList(list.id)
    expect(store.lists.length).toBe(before + 1)
    expect(copy.name).toContain('copie')
  })

  it('saves a list as template', async () => {
    const store = useChecklistsStore()
    const list = firstList(store)
    const before = store.templates.length
    const tpl = await store.saveListAsTemplate(list.id)
    expect(store.templates.length).toBe(before + 1)
    expect(tpl.isTemplate).toBe(true)
  })

  it('moves an item between sections', async () => {
    const store = useChecklistsStore()
    const list = firstList(store)
    const [from, to] = list.sections
    const item = from.items[0]
    const toCount = to.items.length
    store.moveItem(list.id, from.id, item.id, to.id)
    expect(from.items.some((i) => i.id === item.id)).toBe(false)
    expect(to.items.length).toBe(toCount + 1)
  })

  it('tracks item frequency and suggests completions', async () => {
    const store = useChecklistsStore()
    store.addItem(firstList(store).id, '', 'Pâtes')
    store.addItem(firstList(store).id, '', 'Pâtes')
    store.addItem(firstList(store).id, '', 'Pain')
    expect(await store.suggestionsFor('pâ')).toContain('pâtes')
    expect((await store.suggestionsFor('pâ'))[0]).toBe('pâtes')
    expect(await store.suggestionsFor('x')).toEqual([])
  })

  it('ignores persisted state from an older version (no version field)', async () => {
    const stale = JSON.stringify({
      lists: [{ id: 'old', name: 'Ancienne liste', sections: [{ id: 's', name: 'Divers', items: [] }] }],
      templates: []
    })
    localStorage.setItem('checkmate-state-v2', stale)
    const store = useChecklistsStore()
    expect(store.lists.some((l) => l.id === 'old')).toBe(false)
    expect(store.lists.length).toBeGreaterThan(0)
  })

  it('persists to localStorage', async () => {
    const store = useChecklistsStore()
    const list = firstList(store)
    store.toggleItem(list.id, list.sections[0].id, list.sections[0].items[0].id)
    store.persist()
    const raw = localStorage.getItem('checkmate-state-v2')
    expect(raw).toBeTruthy()
    const parsed = JSON.parse(raw)
    expect(parsed.lists.length).toBe(store.lists.length)
  })

  it('removes and restores a list', async () => {
    const store = useChecklistsStore()
    const list = firstList(store)
    const count = store.lists.length
    const payload = await store.removeList(list.id)
    expect(store.lists.length).toBe(count - 1)
    store.restoreList(payload)
    expect(store.lists.length).toBe(count)
    expect(store.lists.some((l) => l.id === list.id)).toBe(true)
  })

  it('removes and restores a template', async () => {
    const store = useChecklistsStore()
    const tpl = store.templates[0]
    const count = store.templates.length
    const payload = store.removeTemplate(tpl.id)
    expect(store.templates.length).toBe(count - 1)
    store.restoreTemplate(payload)
    expect(store.templates.length).toBe(count)
  })

  it('sets item quantity', async () => {
    const store = useChecklistsStore()
    const list = firstList(store)
    const section = list.sections[0]
    const item = section.items[0]
    store.setQuantity(list.id, section.id, item.id, 3)
    expect(item.quantity).toBe('3')
    store.setQuantity(list.id, section.id, item.id, '')
    expect(item.quantity).toBe(null)
  })

  it('manages spaces', async () => {
    const store = useChecklistsStore()
    const space = await store.addSpace('Jardin', '🌿')
    expect(store.spaces.some((s) => s.id === space.id)).toBe(true)
    const list = firstList(store)
    store.setListSpace(list.id, space.id)
    expect(list.spaceId).toBe(space.id)
    expect(store.listsInSpace(space.id).some((l) => l.id === list.id)).toBe(true)
    store.renameSpace(space.id, 'Potager')
    expect(store.spaceById(space.id).name).toBe('Potager')
    store.removeSpace(space.id)
    expect(list.spaceId).toBe(null)
  })

  it('manages labels and list-label assignment', async () => {
    const store = useChecklistsStore()
    const label = store.addLabel('Test', '#123456')
    const list = firstList(store)
    store.toggleListLabel(list.id, label.id)
    expect(list.labelIds).toContain(label.id)
    expect(store.listsWithLabel(label.id).some((l) => l.id === list.id)).toBe(true)
    store.toggleListLabel(list.id, label.id)
    expect(list.labelIds).not.toContain(label.id)
    store.toggleListLabel(list.id, label.id)
    store.removeLabel(label.id)
    expect(list.labelIds).not.toContain(label.id)
  })

  it('sets list date ranges and feeds today view', async () => {
    const store = useChecklistsStore()
    const today = new Date().toISOString().slice(0, 10)
    const list = await store.createEmptyList('Du jour')
    await store.setListDates(list.id, today, today)
    expect(list.startDate).toBe(today)
    expect(store.todayLists.some((l) => l.id === list.id)).toBe(true)
    const future = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)
    await store.setListDates(list.id, future, future)
    expect(store.todayLists.some((l) => l.id === list.id)).toBe(false)
    expect(store.upcomingLists.some((l) => l.id === list.id)).toBe(true)
  })

  it('distinguishes active and done lists', async () => {
    const store = useChecklistsStore()
    const list = firstList(store)
    expect(store.activeLists.some((l) => l.id === list.id)).toBe(true)
    expect(store.doneLists.some((l) => l.id === list.id)).toBe(false)
    for (const s of list.sections) {
      for (const i of s.items) i.checked = true
    }
    expect(store.activeLists.some((l) => l.id === list.id)).toBe(false)
    expect(store.doneLists.some((l) => l.id === list.id)).toBe(true)
  })
})
