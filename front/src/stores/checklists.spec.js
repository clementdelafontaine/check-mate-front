import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useChecklistsStore, GENERIC_SECTION } from './checklists'

const firstList = (store) => store.lists[0]

describe('checklists store', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('starts with mock lists and templates', () => {
    const store = useChecklistsStore()
    expect(store.lists.length).toBeGreaterThan(0)
    expect(store.templates.length).toBeGreaterThan(0)
  })

  it('toggles items', () => {
    const store = useChecklistsStore()
    const list = firstList(store)
    const section = list.sections[0]
    const item = section.items[0]
    expect(item.checked).toBe(false)
    store.toggleItem(list.id, section.id, item.id)
    expect(item.checked).toBe(true)
    store.toggleItem(list.id, section.id, item.id)
    expect(item.checked).toBe(false)
  })

  it('adds items to the generic section when none provided', () => {
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

  it('removes an item and can restore it', () => {
    const store = useChecklistsStore()
    const list = firstList(store)
    const section = list.sections[0]
    const item = section.items[0]
    const payload = store.removeItem(list.id, section.id, item.id)
    expect(section.items.some((i) => i.id === item.id)).toBe(false)
    store.restoreItem(list.id, section.id, payload)
    expect(section.items.some((i) => i.id === item.id)).toBe(true)
  })

  it('clears checked items and restores them', () => {
    const store = useChecklistsStore()
    const list = firstList(store)
    const section = list.sections[0]
    const item = section.items[0]
    store.toggleItem(list.id, section.id, item.id)
    const removed = store.clearChecked(list.id)
    expect(removed.length).toBe(1)
    expect(section.items.length).toBe(section.items.filter((i) => !i.checked).length)
    store.restoreCleared(list.id, removed)
    expect(section.items.some((i) => i.id === item.id)).toBe(true)
  })

  it('resets all checked states', () => {
    const store = useChecklistsStore()
    const list = firstList(store)
    const section = list.sections[0]
    store.toggleItem(list.id, section.id, section.items[0].id)
    store.resetList(list.id)
    const anyChecked = list.sections.some((s) => s.items.some((i) => i.checked))
    expect(anyChecked).toBe(false)
  })

  it('creates a list from a template with unchecked items', () => {
    const store = useChecklistsStore()
    const tpl = store.templates[0]
    const created = store.createListFromTemplate(tpl.id, 'Ma liste')
    expect(created.name).toBe('Ma liste')
    const anyChecked = created.sections.some((s) => s.items.some((i) => i.checked))
    expect(anyChecked).toBe(false)
    const templateItemCount = tpl.sections.reduce((n, s) => n + s.items.length, 0)
    const createdItemCount = created.sections.reduce((n, s) => n + s.items.length, 0)
    expect(createdItemCount).toBe(templateItemCount)
  })

  it('duplicates a list', () => {
    const store = useChecklistsStore()
    const list = firstList(store)
    const before = store.lists.length
    const copy = store.duplicateList(list.id)
    expect(store.lists.length).toBe(before + 1)
    expect(copy.name).toContain('copie')
  })

  it('saves a list as template', () => {
    const store = useChecklistsStore()
    const list = firstList(store)
    const before = store.templates.length
    const tpl = store.saveListAsTemplate(list.id)
    expect(store.templates.length).toBe(before + 1)
    expect(tpl.isTemplate).toBe(true)
  })

  it('moves an item between sections', () => {
    const store = useChecklistsStore()
    const list = firstList(store)
    const [from, to] = list.sections
    const item = from.items[0]
    const toCount = to.items.length
    store.moveItem(list.id, from.id, item.id, to.id)
    expect(from.items.some((i) => i.id === item.id)).toBe(false)
    expect(to.items.length).toBe(toCount + 1)
  })

  it('tracks item frequency and suggests completions', () => {
    const store = useChecklistsStore()
    store.addItem(firstList(store).id, '', 'Pâtes')
    store.addItem(firstList(store).id, '', 'Pâtes')
    store.addItem(firstList(store).id, '', 'Pain')
    expect(store.suggestionsFor('pâ')).toContain('pâtes')
    expect(store.suggestionsFor('pâ')[0]).toBe('pâtes')
    expect(store.suggestionsFor('x')).toEqual([])
  })

  it('persists to localStorage', () => {
    const store = useChecklistsStore()
    const list = firstList(store)
    store.toggleItem(list.id, list.sections[0].id, list.sections[0].items[0].id)
    store.persist()
    const raw = localStorage.getItem('checkmate-state-v1')
    expect(raw).toBeTruthy()
    const parsed = JSON.parse(raw)
    expect(parsed.lists.length).toBe(store.lists.length)
  })

  it('removes and restores a list', () => {
    const store = useChecklistsStore()
    const list = firstList(store)
    const count = store.lists.length
    const payload = store.removeList(list.id)
    expect(store.lists.length).toBe(count - 1)
    store.restoreList(payload)
    expect(store.lists.length).toBe(count)
    expect(store.lists.some((l) => l.id === list.id)).toBe(true)
  })

  it('removes and restores a template', () => {
    const store = useChecklistsStore()
    const tpl = store.templates[0]
    const count = store.templates.length
    const payload = store.removeTemplate(tpl.id)
    expect(store.templates.length).toBe(count - 1)
    store.restoreTemplate(payload)
    expect(store.templates.length).toBe(count)
  })

  it('sets item quantity', () => {
    const store = useChecklistsStore()
    const list = firstList(store)
    const section = list.sections[0]
    const item = section.items[0]
    store.setQuantity(list.id, section.id, item.id, 3)
    expect(item.quantity).toBe('3')
    store.setQuantity(list.id, section.id, item.id, '')
    expect(item.quantity).toBe(null)
  })
})
