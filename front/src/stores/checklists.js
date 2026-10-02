import { defineStore } from 'pinia'
import { templates, initialLists, uid } from '../mocks/data'

export const GENERIC_SECTION = 'Divers'
const STORAGE_KEY = 'checkmate-state-v1'

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || !Array.isArray(parsed.lists) || !Array.isArray(parsed.templates)) return null
    return parsed
  } catch {
    return null
  }
}

const defaultState = () => ({
  lists: initialLists(),
  templates,
  itemFrequency: {}
})

export const useChecklistsStore = defineStore('checklists', {
  state: () => loadState() || defaultState(),
  getters: {
    listById: (state) => (id) => state.lists.find((l) => l.id === id),
    templateById: (state) => (id) => state.templates.find((t) => t.id === id),
    knownItemLabels: (state) => Object.keys(state.itemFrequency).sort()
  },
  actions: {
    persist() {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ lists: this.lists, templates: this.templates, itemFrequency: this.itemFrequency })
        )
      } catch {
        /* quota exceeded or storage unavailable: ignore */
      }
    },
    trackItemLabel(label) {
      const key = label.trim().toLowerCase()
      if (!key) return
      this.itemFrequency[key] = (this.itemFrequency[key] || 0) + 1
    },
    suggestionsFor(prefix, limit = 5) {
      const p = prefix.trim().toLowerCase()
      if (!p) return []
      return Object.entries(this.itemFrequency)
        .filter(([label]) => label.startsWith(p))
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([label]) => label)
    },
    toggleItem(listId, sectionId, itemId) {
      const item = this.findItem(listId, sectionId, itemId)
      if (item) item.checked = !item.checked
    },
    setQuantity(listId, sectionId, itemId, quantity) {
      const item = this.findItem(listId, sectionId, itemId)
      if (!item) return
      const value = quantity === null || quantity === undefined || quantity === ''
        ? null
        : String(quantity)
      item.quantity = value
    },
    addItem(listId, sectionId, label, quantity = null) {
      const list = this.lists.find((l) => l.id === listId)
      if (!list) return
      let section = list.sections.find((s) => s.id === sectionId)
      if (!section) {
        section = { id: uid(), name: GENERIC_SECTION, items: [] }
        list.sections.push(section)
      }
      section.items.push({ id: uid(), label, quantity, checked: false })
      this.trackItemLabel(label)
    },
    addSection(listId, name) {
      const list = this.lists.find((l) => l.id === listId)
      if (!list) return null
      const section = { id: uid(), name, items: [] }
      list.sections.push(section)
      return section
    },
    addTemplateSection(templateId, name) {
      const tpl = this.templates.find((t) => t.id === templateId)
      if (!tpl) return null
      const section = { id: uid(), name, items: [] }
      tpl.sections.push(section)
      return section
    },
    addTemplateItem(templateId, sectionId, label, quantity = null) {
      const tpl = this.templates.find((t) => t.id === templateId)
      if (!tpl) return
      let section = tpl.sections.find((s) => s.id === sectionId)
      if (!section) {
        section = { id: uid(), name: GENERIC_SECTION, items: [] }
        tpl.sections.push(section)
      }
      section.items.push({ label, quantity })
      this.trackItemLabel(label)
    },
    removeItem(listId, sectionId, itemId) {
      const section = this.findSection(listId, sectionId)
      if (!section) return null
      const index = section.items.findIndex((i) => i.id === itemId)
      if (index === -1) return null
      const [removed] = section.items.splice(index, 1)
      return { section, item: removed, index }
    },
    restoreItem(listId, sectionId, payload) {
      if (!payload) return
      payload.section.items.splice(Math.min(payload.index, payload.section.items.length), 0, payload.item)
    },
    removeTemplateItem(templateId, sectionId, itemLabel) {
      const tpl = this.templates.find((t) => t.id === templateId)
      if (!tpl) return
      const section = tpl.sections.find((s) => s.id === sectionId)
      if (!section) return
      const index = section.items.findIndex((i) => i.label === itemLabel)
      if (index === -1) return
      section.items.splice(index, 1)
    },
    clearChecked(listId) {
      const list = this.lists.find((l) => l.id === listId)
      if (!list) return
      const removed = []
      for (const s of list.sections) {
        const kept = []
        for (const i of s.items) {
          if (i.checked) removed.push({ section: s, item: i })
          else kept.push(i)
        }
        s.items = kept
      }
      return removed
    },
    restoreCleared(listId, removed) {
      if (!removed) return
      for (const { section, item } of removed) {
        section.items.push(item)
      }
    },
    resetList(listId) {
      const list = this.lists.find((l) => l.id === listId)
      if (!list) return
      for (const s of list.sections) {
        for (const i of s.items) i.checked = false
      }
    },
    removeList(listId) {
      const index = this.lists.findIndex((l) => l.id === listId)
      if (index === -1) return null
      const [removed] = this.lists.splice(index, 1)
      return { list: removed, index }
    },
    restoreList(payload) {
      if (!payload) return
      this.lists.splice(Math.min(payload.index, this.lists.length), 0, payload.list)
    },
    removeTemplate(templateId) {
      const index = this.templates.findIndex((t) => t.id === templateId)
      if (index === -1) return null
      const [removed] = this.templates.splice(index, 1)
      return { template: removed, index }
    },
    restoreTemplate(payload) {
      if (!payload) return
      this.templates.splice(Math.min(payload.index, this.templates.length), 0, payload.template)
    },
    createEmptyList(name, emoji = '📋') {
      const list = {
        id: uid(),
        name,
        emoji,
        kind: 'simple',
        isTemplate: false,
        sections: [{ id: uid(), name: GENERIC_SECTION, items: [] }]
      }
      this.lists.unshift(list)
      return list
    },
    createEmptyTemplate(name, description = '', emoji = '✨') {
      const tpl = {
        id: uid(),
        name,
        emoji,
        kind: 'template',
        isTemplate: true,
        description,
        sections: []
      }
      this.templates.push(tpl)
      return tpl
    },
    createListFromTemplate(templateId, name = null, emoji = null) {
      const tpl = this.templates.find((t) => t.id === templateId)
      if (!tpl) return null
      const list = {
        id: uid(),
        name: name || tpl.name,
        emoji: emoji || tpl.emoji,
        kind: 'simple',
        isTemplate: false,
        sections: tpl.sections.map((s) => ({
          id: uid(),
          name: s.name,
          items: s.items.map((i) => ({ id: uid(), label: i.label, quantity: i.quantity ?? null, checked: false }))
        }))
      }
      this.lists.unshift(list)
      return list
    },
    duplicateList(listId) {
      const list = this.lists.find((l) => l.id === listId)
      if (!list) return null
      const copy = {
        id: uid(),
        name: `${list.name} (copie)`,
        emoji: list.emoji,
        kind: 'simple',
        isTemplate: false,
        sections: list.sections.map((s) => ({
          id: uid(),
          name: s.name,
          items: s.items.map((i) => ({ id: uid(), label: i.label, quantity: i.quantity ?? null, checked: false }))
        }))
      }
      this.lists.unshift(copy)
      return copy
    },
    saveListAsTemplate(listId) {
      const list = this.lists.find((l) => l.id === listId)
      if (!list) return null
      const tpl = {
        id: uid(),
        name: list.name,
        emoji: list.emoji,
        kind: 'template',
        isTemplate: true,
        description: 'Créé depuis une liste',
        sections: list.sections.map((s) => ({
          id: uid(),
          name: s.name,
          items: s.items.map((i) => ({ label: i.label, quantity: i.quantity ?? null }))
        }))
      }
      this.templates.push(tpl)
      return tpl
    },
    moveItem(listId, fromSectionId, itemId, toSectionId) {
      const list = this.lists.find((l) => l.id === listId)
      if (!list) return
      const from = list.sections.find((s) => s.id === fromSectionId)
      const to = list.sections.find((s) => s.id === toSectionId)
      if (!from || !to) return
      const index = from.items.findIndex((i) => i.id === itemId)
      if (index === -1) return
      const [item] = from.items.splice(index, 1)
      item.checked = false
      to.items.push(item)
    },
    knownSectionNames() {
      const names = new Set()
      for (const l of this.lists) {
        for (const s of l.sections) names.add(s.name)
      }
      for (const t of this.templates) {
        for (const s of t.sections) names.add(s.name)
      }
      return [...names].sort()
    },
    findSection(listId, sectionId) {
      const list = this.lists.find((l) => l.id === listId)
      if (!list) return null
      return list.sections.find((s) => s.id === sectionId) || null
    },
    findItem(listId, sectionId, itemId) {
      const section = this.findSection(listId, sectionId)
      if (!section) return null
      return section.items.find((i) => i.id === itemId) || null
    }
  }
})
