import { defineStore } from 'pinia'
import { templates, initialLists, uid } from '../mocks/data'

export const GENERIC_SECTION = 'Divers'

export const useChecklistsStore = defineStore('checklists', {
  state: () => ({
    lists: initialLists(),
    templates
  }),
  getters: {
    listById: (state) => (id) => state.lists.find((l) => l.id === id),
    templateById: (state) => (id) => state.templates.find((t) => t.id === id)
  },
  actions: {
    toggleItem(listId, sectionId, itemId) {
      const item = this.findItem(listId, sectionId, itemId)
      if (item) item.checked = !item.checked
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
    },
    removeItem(listId, sectionId, itemId) {
      const section = this.findSection(listId, sectionId)
      if (!section) return
      section.items = section.items.filter((i) => i.id !== itemId)
    },
    clearChecked(listId) {
      const list = this.lists.find((l) => l.id === listId)
      if (!list) return
      for (const s of list.sections) {
        s.items = s.items.filter((i) => !i.checked)
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
      this.lists = this.lists.filter((l) => l.id !== listId)
    },
    removeTemplate(templateId) {
      this.templates = this.templates.filter((t) => t.id !== templateId)
    },
    createEmptyList(name) {
      const list = {
        id: uid(),
        name,
        emoji: '📋',
        kind: 'simple',
        isTemplate: false,
        sections: [{ id: uid(), name: 'Divers', items: [] }]
      }
      this.lists.unshift(list)
      return list
    },
    createEmptyTemplate(name, description = '') {
      const tpl = {
        id: uid(),
        name,
        emoji: '✨',
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
          items: s.items.map((i) => ({ id: uid(), label: i.label, checked: false }))
        }))
      }
      this.lists.unshift(list)
      return list
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
