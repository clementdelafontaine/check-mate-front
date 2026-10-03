import { defineStore } from 'pinia'
import { templates, initialLists, itemFrequencySeed, uid } from '../mocks/data'
import { api } from '../services/api.js'

export const GENERIC_SECTION = 'Divers'
export const ITEM_KINDS = ['task', 'product']
export const LIST_TYPES = [
  { id: 'checklist', label: 'Checklist', emoji: '✅', defaultItemKind: 'task' },
  { id: 'grocery', label: 'Courses', emoji: '🛒', defaultItemKind: 'product' },
  { id: 'todo', label: 'To-do', emoji: '📝', defaultItemKind: 'task' }
]

const STORAGE_KEY = 'checkmate-state-v2'
const STATE_VERSION = 1

export const DEFAULT_SPACES = [
  { id: 'sp-maison', name: 'Maison', emoji: '🏠' },
  { id: 'sp-courses', name: 'Courses', emoji: '🛒' },
  { id: 'sp-voyages', name: 'Voyages', emoji: '✈️' },
  { id: 'sp-perso', name: 'Perso', emoji: '👤' }
]

export const DEFAULT_LABELS = [
  { id: 'lb-quotidien', name: 'Quotidien', color: '#4d8dff' },
  { id: 'lb-menage', name: 'Ménage', color: '#f5a524' },
  { id: 'lb-urgent', name: 'Urgent', color: '#e5484d' },
  { id: 'lb-jardin', name: 'Jardin', color: '#3fb950' },
  { id: 'lb-sortie', name: 'Sortie', color: '#a371f7' }
]

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || !Array.isArray(parsed.lists) || !Array.isArray(parsed.templates)) return null
    if (parsed.version !== STATE_VERSION) return null
    parsed.spaces = parsed.spaces ?? DEFAULT_SPACES
    parsed.labels = parsed.labels ?? DEFAULT_LABELS
    parsed.itemFrequency = parsed.itemFrequency ?? {}
    for (const l of parsed.lists) {
      for (const s of l.sections) {
        for (const i of s.items) {
          if (i.kind && !ITEM_KINDS.includes(i.kind)) i.kind = 'task'
        }
      }
    }
    return parsed
  } catch {
    return null
  }
}

const defaultState = () => ({
  lists: initialLists(),
  templates,
  spaces: DEFAULT_SPACES,
  labels: DEFAULT_LABELS,
  itemFrequency: { ...itemFrequencySeed }
})

export const useChecklistsStore = defineStore('checklists', {
  state: () => (api.useApi
    ? { lists: [], templates: [], spaces: [], labels: [], itemFrequency: {} }
    : loadState() || defaultState()),

  getters: {
    listById: (state) => (id) => state.lists.find((l) => l.id === id),
    templateById: (state) => (id) => state.templates.find((t) => t.id === id),
    spaceById: (state) => (id) => state.spaces.find((s) => s.id === id),
    labelById: (state) => (id) => state.labels.find((l) => l.id === id),
    knownItemLabels: (state) => Object.keys(state.itemFrequency).sort(),
    listsInSpace: (state) => (spaceId) => state.lists.filter((l) => l.spaceId === spaceId),
    listsWithLabel: (state) => (labelId) => state.lists.filter((l) => l.labelIds?.includes(labelId)),
    todayStr: () => {
      const d = new Date()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${d.getFullYear()}-${m}-${day}`
    },
    activeLists: (state) =>
      state.lists.filter((l) => l.sections.some((s) => s.items.some((i) => !i.checked))),
    doneLists: (state) =>
      state.lists.filter((l) => !l.sections.some((s) => s.items.some((i) => !i.checked))),
    todayLists: (state) => {
      const today = new Date().toISOString().slice(0, 10)
      return state.lists.filter((l) => {
        if (!l.startDate) return false
        if (l.startDate > today) return false
        if (l.endDate && l.endDate < today) return false
        return true
      })
    },
    upcomingLists: (state) => {
      const today = new Date().toISOString().slice(0, 10)
      return state.lists.filter((l) => l.startDate && l.startDate > today)
    },
    overdueLists: (state) => {
      const today = new Date().toISOString().slice(0, 10)
      return state.lists.filter(
        (l) => l.startDate && l.startDate < today && l.endDate && l.endDate < today && !isListDone(l)
      )
    }
  },

  actions: {
    async init() {
      if (!api.useApi) return
      await this.refresh()
    },

    async refresh() {
      if (!api.useApi) return
      const data = await api.fetchAll()
      this.lists = data.lists
      this.templates = data.templates
      this.spaces = data.spaces
      this.labels = data.labels
    },

    persist() {
      if (api.useApi) return
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            version: STATE_VERSION,
            lists: this.lists,
            templates: this.templates,
            spaces: this.spaces,
            labels: this.labels,
            itemFrequency: this.itemFrequency
          })
        )
      } catch {
        /* storage unavailable */
      }
    },

    trackItemLabel(label) {
      const key = label.trim().toLowerCase()
      if (!key) return
      this.itemFrequency[key] = (this.itemFrequency[key] || 0) + 1
    },

    async suggestionsFor(prefix, limit = 5) {
      const p = prefix.trim().toLowerCase()
      if (!p) return []
      if (api.useApi) {
        try {
          return await api.suggestions(p, limit)
        } catch {
          return []
        }
      }
      return Object.entries(this.itemFrequency)
        .filter(([label]) => label.startsWith(p))
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([label]) => label)
    },

    async toggleItem(listId, sectionId, itemId) {
      const item = this.findItem(listId, sectionId, itemId)
      if (!item) return
      item.checked = !item.checked
      if (api.useApi) {
        try {
          await api.updateItem(itemId, { checked: item.checked })
        } catch {
          item.checked = !item.checked
        }
      }
    },

    async setQuantity(listId, sectionId, itemId, quantity) {
      const item = this.findItem(listId, sectionId, itemId)
      if (!item) return
      const prev = item.quantity
      const value = quantity === null || quantity === undefined || quantity === '' ? null : String(quantity)
      item.quantity = value
      if (api.useApi) {
        try {
          await api.updateItem(itemId, { quantity: value })
        } catch {
          item.quantity = prev
        }
      }
    },

    async updateItem(listId, sectionId, itemId, { label, quantity, kind }) {
      const item = this.findItem(listId, sectionId, itemId)
      if (!item) return null
      if (label !== undefined && label !== null && label !== '') item.label = label
      if (kind !== undefined && kind !== null && ITEM_KINDS.includes(kind)) item.kind = kind
      if (quantity !== undefined) {
        item.quantity = kind === 'task' || quantity === null || quantity === undefined || quantity === '' ? null : String(quantity)
      }
      if (api.useApi) {
        try {
          await api.updateItem(itemId, { label: item.label, kind: item.kind, quantity: item.quantity })
        } catch {
          /* keep optimistic state */
        }
      }
      return item
    },

    defaultItemKind(listId) {
      const list = this.lists.find((l) => l.id === listId)
      if (!list) return 'task'
      const type = LIST_TYPES.find((t) => t.id === list.type)
      return type ? type.defaultItemKind : 'task'
    },

    async addItem(listId, sectionId, label, quantity = null, kind = 'task') {
      if (api.useApi) {
        await api.addItem(sectionId, { label, kind, quantity })
        const fresh = await api.fetchAll()
        this.lists = fresh.lists
        this.trackItemLabel(label)
        return
      }
      const list = this.lists.find((l) => l.id === listId)
      if (!list) return
      let section = list.sections.find((s) => s.id === sectionId)
      if (!section) {
        section = { id: uid(), name: GENERIC_SECTION, items: [] }
        list.sections.push(section)
      }
      section.items.push({ id: uid(), label, quantity, kind, checked: false })
      this.trackItemLabel(label)
    },

    async addSection(listId, name) {
      if (api.useApi) {
        const section = await api.addSection(listId, name)
        await this.refresh()
        return section
      }
      const list = this.lists.find((l) => l.id === listId)
      if (!list) return null
      const section = { id: uid(), name, items: [] }
      list.sections.push(section)
      return section
    },

    async addTemplateSection(templateId, name) {
      if (api.useApi) {
        const section = await api.addTemplateSection(templateId, name)
        await this.refresh()
        return section
      }
      const tpl = this.templates.find((t) => t.id === templateId)
      if (!tpl) return null
      const section = { id: uid(), name, items: [] }
      tpl.sections.push(section)
      return section
    },

    async addTemplateItem(templateId, sectionId, label, quantity = null, kind = 'task') {
      if (api.useApi) {
        await api.addTemplateItem(sectionId, { label, kind, quantity })
        await this.refresh()
        return
      }
      const tpl = this.templates.find((t) => t.id === templateId)
      if (!tpl) return
      let section = tpl.sections.find((s) => s.id === sectionId)
      if (!section) {
        section = { id: uid(), name: GENERIC_SECTION, items: [] }
        tpl.sections.push(section)
      }
      section.items.push({ label, quantity, kind })
      this.trackItemLabel(label)
    },

    async removeItem(listId, sectionId, itemId) {
      const section = this.findSection(listId, sectionId)
      if (!section) return null
      const index = section.items.findIndex((i) => i.id === itemId)
      if (index === -1) return null
      const [removed] = section.items.splice(index, 1)
      if (api.useApi) {
        try {
          await api.removeItem(itemId)
        } catch {
          section.items.splice(index, 0, removed)
          return null
        }
      }
      return { section, item: removed, index }
    },

    restoreItem(listId, sectionId, payload) {
      if (!payload) return
      payload.section.items.splice(Math.min(payload.index, payload.section.items.length), 0, payload.item)
      if (api.useApi) {
        api.addItem(payload.item.sectionId ?? payload.section.id, {
          label: payload.item.label,
          kind: payload.item.kind,
          quantity: payload.item.quantity
        }).catch(() => {})
      }
    },

    async removeTemplateItem(templateId, sectionId, itemLabel) {
      const tpl = this.templates.find((t) => t.id === templateId)
      if (!tpl) return
      const section = tpl.sections.find((s) => s.id === sectionId)
      if (!section) return
      const index = section.items.findIndex((i) => i.label === itemLabel)
      if (index === -1) return
      const [removed] = section.items.splice(index, 1)
      if (api.useApi && removed.id) {
        try {
          await api.removeTemplateItem(removed.id)
        } catch {
          section.items.splice(index, 0, removed)
        }
      }
    },

    async clearChecked(listId) {
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
      if (api.useApi) {
        try {
          await api.clearChecked(listId)
        } catch {
          this.restoreCleared(listId, removed)
          return []
        }
      }
      return removed
    },

    restoreCleared(listId, removed) {
      if (!removed) return
      for (const { section, item } of removed) {
        section.items.push(item)
      }
      if (api.useApi) {
        for (const { section, item } of removed) {
          api.addItem(section.id, { label: item.label, kind: item.kind, quantity: item.quantity }).catch(() => {})
        }
      }
    },

    async resetList(listId) {
      const list = this.lists.find((l) => l.id === listId)
      if (!list) return
      for (const s of list.sections) {
        for (const i of s.items) i.checked = false
      }
      if (api.useApi) {
        try {
          await api.resetList(listId)
        } catch {
          /* keep optimistic state */
        }
      }
    },

    async removeList(listId) {
      const index = this.lists.findIndex((l) => l.id === listId)
      if (index === -1) return null
      const [removed] = this.lists.splice(index, 1)
      if (api.useApi) {
        try {
          await api.removeList(listId)
        } catch {
          this.lists.splice(index, 0, removed)
          return null
        }
      }
      return { list: removed, index }
    },

    restoreList(payload) {
      if (!payload) return
      this.lists.splice(Math.min(payload.index, this.lists.length), 0, payload.list)
      if (api.useApi) {
        api.createList({
          name: payload.list.name,
          emoji: payload.list.emoji,
          type: payload.list.type,
          spaceId: payload.list.spaceId,
          labelIds: payload.list.labelIds,
          startDate: payload.list.startDate,
          endDate: payload.list.endDate
        }).catch(() => {})
      }
    },

    async removeTemplate(templateId) {
      const index = this.templates.findIndex((t) => t.id === templateId)
      if (index === -1) return null
      const [removed] = this.templates.splice(index, 1)
      if (api.useApi) {
        try {
          await api.removeTemplate(templateId)
        } catch {
          this.templates.splice(index, 0, removed)
          return null
        }
      }
      return { template: removed, index }
    },

    restoreTemplate(payload) {
      if (!payload) return
      this.templates.splice(Math.min(payload.index, this.templates.length), 0, payload.template)
      if (api.useApi) {
        api.createTemplate({
          name: payload.template.name,
          emoji: payload.template.emoji,
          description: payload.template.description
        }).catch(() => {})
      }
    },

    async createEmptyList(name, emoji = '📋', spaceId = null, labelIds = [], startDate = null, endDate = null) {
      if (api.useApi) {
        const created = await api.createList({
          name, emoji, type: 'checklist', spaceId, labelIds, startDate, endDate
        })
        await this.refresh()
        return this.listById(created.id) ?? created
      }
      const list = {
        id: uid(),
        name,
        emoji,
        kind: 'simple',
        type: 'checklist',
        isTemplate: false,
        spaceId: spaceId || this.spaces[0]?.id || null,
        labelIds: [...labelIds],
        startDate,
        endDate,
        sections: [{ id: uid(), name: GENERIC_SECTION, items: [] }]
      }
      this.lists.unshift(list)
      return list
    },

    async createEmptyTemplate(name, description = '', emoji = '✨') {
      if (api.useApi) {
        await api.createTemplate({ name, emoji, description })
        await this.refresh()
        return this.templates[this.templates.length - 1]
      }
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

    async createListFromTemplate(templateId, name = null, emoji = null, spaceId = null) {
      const tpl = this.templates.find((t) => t.id === templateId)
      if (!tpl) return null
      if (api.useApi) {
        const created = await api.createList({
          name: name || tpl.name,
          emoji: emoji || tpl.emoji,
          type: tpl.type ?? 'checklist',
          spaceId,
          templateId
        })
        await this.refresh()
        return this.listById(created.id) ?? created
      }
      const list = {
        id: uid(),
        name: name || tpl.name,
        emoji: emoji || tpl.emoji,
        kind: 'simple',
        type: tpl.type ?? 'checklist',
        isTemplate: false,
        spaceId: spaceId || this.spaces[0]?.id || null,
        labelIds: [],
        startDate: null,
        endDate: null,
        sections: tpl.sections.map((s) => ({
          id: uid(),
          name: s.name,
          items: s.items.map((i) => ({ id: uid(), label: i.label, quantity: i.quantity ?? null, kind: i.kind ?? 'task', checked: false }))
        }))
      }
      this.lists.unshift(list)
      return list
    },

    async duplicateList(listId) {
      const list = this.lists.find((l) => l.id === listId)
      if (!list) return null
      if (api.useApi) {
        const copy = await api.duplicateList(listId)
        await this.refresh()
        return this.listById(copy.id) ?? copy
      }
      const copy = {
        ...JSON.parse(JSON.stringify(list)),
        id: uid(),
        name: `${list.name} (copie)`
      }
      copy.sections = copy.sections.map((s) => ({
        id: uid(),
        name: s.name,
        items: s.items.map((i) => ({ ...i, id: uid(), checked: false }))
      }))
      this.lists.unshift(copy)
      return copy
    },

    async saveListAsTemplate(listId) {
      const list = this.lists.find((l) => l.id === listId)
      if (!list) return null
      if (api.useApi) {
        await api.saveListAsTemplate(listId)
        await this.refresh()
        return null
      }
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
          items: s.items.map((i) => ({ label: i.label, quantity: i.quantity ?? null, kind: i.kind ?? 'task' }))
        }))
      }
      this.templates.push(tpl)
      return tpl
    },

    async moveItem(listId, fromSectionId, itemId, toSectionId) {
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
      if (api.useApi) {
        try {
          await api.moveItem(itemId, toSectionId)
        } catch {
          from.items.splice(index, 0, item)
          to.items.splice(to.items.indexOf(item), 1)
        }
      }
    },

    async setListSpace(listId, spaceId) {
      const list = this.lists.find((l) => l.id === listId)
      if (list) list.spaceId = spaceId
      if (api.useApi) {
        try {
          await api.updateList(listId, { spaceId })
        } catch {
          /* keep optimistic state */
        }
      }
    },

    async updateList(listId, { name, emoji, spaceId, labelIds, startDate, endDate, type }) {
      const list = this.lists.find((l) => l.id === listId)
      if (!list) return null
      if (name !== undefined && name !== null && name !== '') list.name = name
      if (emoji !== undefined && emoji !== null && emoji !== '') list.emoji = emoji
      if (spaceId !== undefined) list.spaceId = spaceId || null
      if (type !== undefined && type !== null) {
        const t = LIST_TYPES.find((x) => x.id === type)
        if (t) list.type = t.id
      }
      if (labelIds !== undefined) list.labelIds = [...labelIds]
      if (startDate !== undefined || endDate !== undefined) {
        list.startDate = startDate || null
        list.endDate = endDate || (startDate || null)
      }
      if (api.useApi) {
        try {
          await api.updateList(listId, {
            name, emoji, type, spaceId, labelIds, startDate, endDate
          })
        } catch {
          /* keep optimistic state */
        }
      }
      return list
    },

    async toggleListLabel(listId, labelId) {
      const list = this.lists.find((l) => l.id === listId)
      if (!list) return
      list.labelIds = list.labelIds ?? []
      const i = list.labelIds.indexOf(labelId)
      if (i === -1) list.labelIds.push(labelId)
      else list.labelIds.splice(i, 1)
      if (api.useApi) {
        try {
          await api.toggleListLabel(listId, labelId)
        } catch {
          if (i === -1) list.labelIds.splice(list.labelIds.indexOf(labelId), 1)
          else list.labelIds.push(labelId)
        }
      }
    },

    async setListDates(listId, startDate, endDate) {
      const list = this.lists.find((l) => l.id === listId)
      if (!list) return
      list.startDate = startDate || null
      list.endDate = endDate || (startDate || null)
      if (api.useApi) {
        try {
          await api.updateList(listId, { startDate: list.startDate, endDate: list.endDate })
        } catch {
          /* keep optimistic state */
        }
      }
    },

    async addSpace(name, emoji = '📁') {
      if (api.useApi) {
        const space = await api.addSpace(name, emoji)
        await this.refresh()
        return space
      }
      const space = { id: uid(), name, emoji }
      this.spaces.push(space)
      return space
    },

    async renameSpace(spaceId, name) {
      const space = this.spaces.find((s) => s.id === spaceId)
      if (space) space.name = name
      if (api.useApi) {
        try {
          await api.renameSpace(spaceId, name)
        } catch {
          /* keep optimistic state */
        }
      }
    },

    async removeSpace(spaceId) {
      this.spaces = this.spaces.filter((s) => s.id !== spaceId)
      for (const l of this.lists) {
        if (l.spaceId === spaceId) l.spaceId = null
      }
      if (api.useApi) {
        try {
          await api.removeSpace(spaceId)
        } catch {
          /* keep optimistic state */
        }
      }
    },

    async addLabel(name, color = '#4d8dff') {
      if (api.useApi) {
        const label = await api.addLabel(name, color)
        await this.refresh()
        return label
      }
      const label = { id: uid(), name, color }
      this.labels.push(label)
      return label
    },

    async removeLabel(labelId) {
      this.labels = this.labels.filter((l) => l.id !== labelId)
      for (const list of this.lists) {
        list.labelIds = (list.labelIds ?? []).filter((id) => id !== labelId)
      }
      if (api.useApi) {
        try {
          await api.removeLabel(labelId)
        } catch {
          /* keep optimistic state */
        }
      }
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

function isListDone(list) {
  return !list.sections.some((s) => s.items.some((i) => !i.checked))
}
