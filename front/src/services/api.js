const BASE = import.meta.env.VITE_API_BASE ?? '/api'

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined
  })
  if (res.status === 204) return null
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    if (res.status === 401 && typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
      window.location.href = '/login'
    }
    throw new Error(data?.error ?? `API error ${res.status}`)
  }
  return data
}

const mapList = (l) => ({
  id: l.id,
  name: l.name,
  emoji: l.emoji,
  type: l.type,
  spaceId: l.space_id ?? null,
  labelIds: (l.labelIds ?? []).map(String),
  startDate: l.start_date ?? null,
  endDate: l.end_date ?? null,
  sections: (l.sections ?? []).map(mapSection)
})

const mapSection = (s) => ({
  id: s.id,
  name: s.name,
  items: (s.items ?? []).map((i) => ({
    id: i.id,
    label: i.label,
    kind: i.kind ?? 'task',
    quantity: i.quantity ?? null,
    checked: i.checked ?? false
  }))
})

const mapTemplate = (t) => ({
  id: t.id,
  name: t.name,
  emoji: t.emoji,
  description: t.description ?? '',
  type: t.type ?? 'checklist',
  sections: (t.sections ?? []).map(mapSection)
})

export const api = {
  useApi: import.meta.env.VITE_USE_API === 'true',

  async fetchAll() {
    const [lists, templates, spaces, labels] = await Promise.all([
      request('/lists'),
      request('/templates'),
      request('/spaces'),
      request('/labels')
    ])
    return {
      lists: lists.map(mapList),
      templates: templates.map(mapTemplate),
      spaces: spaces.map((s) => ({ id: s.id, name: s.name, emoji: s.emoji })),
      labels: labels.map((l) => ({ id: l.id, name: l.name, color: l.color }))
    }
  },

  createList({ name, emoji, type, spaceId, labelIds, startDate, endDate, templateId }) {
    return request('/lists', {
      method: 'POST',
      body: { name, emoji, type, spaceId, labelIds, startDate, endDate, templateId }
    }).then(mapList)
  },

  updateList(listId, patch) {
    return request(`/lists/${listId}`, { method: 'PATCH', body: patch }).then(mapList)
  },

  removeList(listId) {
    return request(`/lists/${listId}`, { method: 'DELETE' })
  },

  duplicateList(listId) {
    return request(`/lists/${listId}/duplicate`, { method: 'POST' }).then(mapList)
  },

  saveListAsTemplate(listId) {
    return request(`/lists/${listId}/template`, { method: 'POST' })
  },

  clearChecked(listId) {
    return request(`/lists/${listId}/clear-checked`, { method: 'POST' })
  },

  resetList(listId) {
    return request(`/lists/${listId}/reset`, { method: 'POST' })
  },

  toggleListLabel(listId, labelId) {
    return request(`/lists/${listId}/labels/${labelId}/toggle`, { method: 'POST' })
  },

  addSection(listId, name) {
    return request(`/lists/${listId}/sections`, { method: 'POST', body: { name } })
  },

  addItem(sectionId, { label, kind, quantity }) {
    return request(`/sections/${sectionId}/items`, {
      method: 'POST',
      body: { label, kind, quantity }
    })
  },

  updateItem(itemId, patch) {
    return request(`/items/${itemId}`, { method: 'PATCH', body: patch })
  },

  removeItem(itemId) {
    return request(`/items/${itemId}`, { method: 'DELETE' })
  },

  moveItem(itemId, toSectionId) {
    return request(`/items/${itemId}/move`, { method: 'POST', body: { toSectionId } })
  },

  suggestions(prefix, limit = 5) {
    const qs = new URLSearchParams({ prefix, limit })
    return request(`/suggestions?${qs}`)
  },

  addSpace(name, emoji) {
    return request('/spaces', { method: 'POST', body: { name, emoji } })
  },

  renameSpace(spaceId, name) {
    return request(`/spaces/${spaceId}`, { method: 'PATCH', body: { name } })
  },

  removeSpace(spaceId) {
    return request(`/spaces/${spaceId}`, { method: 'DELETE' })
  },

  addLabel(name, color) {
    return request('/labels', { method: 'POST', body: { name, color } })
  },

  removeLabel(labelId) {
    return request(`/labels/${labelId}`, { method: 'DELETE' })
  },

  createTemplate({ name, emoji, description, type }) {
    return request('/templates', { method: 'POST', body: { name, emoji, description, type } })
  },

  removeTemplate(templateId) {
    return request(`/templates/${templateId}`, { method: 'DELETE' })
  },

  addTemplateSection(templateId, name) {
    return request(`/templates/${templateId}/sections`, { method: 'POST', body: { name } })
  },

  addTemplateItem(sectionId, { label, kind, quantity }) {
    return request(`/template-sections/${sectionId}/items`, {
      method: 'POST',
      body: { label, kind, quantity }
    })
  },

  removeTemplateItem(itemId) {
    return request(`/template-items/${itemId}`, { method: 'DELETE' })
  }
}
