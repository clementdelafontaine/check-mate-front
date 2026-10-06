const BASE = import.meta.env.VITE_API_BASE ?? '/api'

async function request(path, options = {}) {
  const hasBody = options.body !== undefined
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    ...options,
    headers: hasBody ? { 'Content-Type': 'application/json' } : undefined,
    body: hasBody ? JSON.stringify(options.body) : undefined
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
  ownerId: l.user_id ?? null,
  ownerUsername: l.ownerUsername ?? null,
  isShared: l.isShared ?? false,
  spaceId: l.space_id ?? null,
  labelIds: (l.labelIds ?? []).map(String),
  startDate: l.startDate ?? l.start_date ?? null,
  endDate: l.endDate ?? l.end_date ?? null,
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


const mapRecipe = (r) => ({
  id: r.id,
  name: r.name,
  emoji: r.emoji ?? '🍳',
  description: r.description ?? '',
  servings: r.servings ?? null,
  prepMinutes: r.prep_minutes ?? null,
  cookMinutes: r.cook_minutes ?? null,
  source: r.source ?? null,
  tags: r.tags ?? [],
  sections: (r.sections ?? []).map((s) => ({
    id: s.id,
    name: s.name,
    items: (s.items ?? []).map((i) => ({
      id: i.id,
      label: i.label,
      quantity: i.quantity ?? null
    }))
  })),
  steps: (r.steps ?? []).map((s) => ({ id: s.id, text: s.text, checked: s.checked ?? false }))
})


export const api = {
  useApi: import.meta.env.VITE_USE_API === 'true',
  fetchFriends() {
    return request('/friends').then((rows) =>
      rows.map((f) => ({
        id: f.id,
        status: f.status,
        direction: f.direction,
        userId: f.userId,
        username: f.username
      }))
    )
  },
  sendFriendRequest(username) {
    return request('/friends', { method: 'POST', body: { username } })
  },
  acceptFriendRequest(id) {
    return request(`/friends/${id}/accept`, { method: 'POST' })
  },
  removeFriend(id) {
    return request(`/friends/${id}`, { method: 'DELETE' })
  },
  fetchSharedLists() {
    return request('/shared-lists').then((rows) => rows.map(mapList))
  },
  reorderLists(listIds) {
    return request('/lists/reorder', { method: 'PATCH', body: { listIds } })
  },
  fetchListVersions() {
    return request('/lists/versions').then((rows) =>
      rows.map((v) => ({ id: v.id, updatedAt: v.updatedAt }))
    )
  },
  shareList(listId, userId) {
    return request(`/lists/${listId}/collaborators`, { method: 'POST', body: { userId } })
  },
  fetchCollaborators(listId) {
    return request(`/lists/${listId}/collaborators`).then((rows) =>
      rows.map((c) => ({ userId: c.userId, username: c.username }))
    )
  },
  unshareList(listId, userId) {
    return request(`/lists/${listId}/collaborators/${userId}`, { method: 'DELETE' })
  },

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

  moveItem(itemId, toSectionId, position = null) {
    return request(`/items/${itemId}/move`, {
      method: 'POST',
      body: { toSectionId, position }
    })
  },

  suggestions(prefix, limit = 5) {
    const qs = new URLSearchParams({ prefix, limit })
    return request(`/suggestions?${qs}`)
  },

  fetchRecipes() {
    return request('/recipes').then((rows) => rows.map((r) => ({
      ...mapRecipe(r),
      itemCount: Number(r.item_count ?? 0)
    })))
  },
  fetchRecipe(id) {
    return request(`/recipes/${id}`).then(mapRecipe)
  },
  createRecipe(payload) {
    return request('/recipes', { method: 'POST', body: payload }).then(mapRecipe)
  },
  updateRecipe(id, patch) {
    return request(`/recipes/${id}`, { method: 'PATCH', body: patch }).then(mapRecipe)
  },
  removeRecipe(id) {
    return request(`/recipes/${id}`, { method: 'DELETE' })
  },
  toggleRecipeStep(stepId, checked) {
    return request(`/recipe-steps/${stepId}`, { method: 'PATCH', body: { checked } })
  },
  removeRecipeStep(stepId) {
    return request(`/recipe-steps/${stepId}`, { method: 'DELETE' })
  },
  reorderRecipeSteps(recipeId, stepIds) {
    return request(`/recipes/${recipeId}/steps/reorder`, {
      method: 'POST',
      body: { stepIds }
    })
  },
  addRecipeToList(recipeId, listId, itemIds = null) {
    return request(`/recipes/${recipeId}/add-to-list`, {
      method: 'POST',
      body: itemIds ? { listId, itemIds } : { listId }
    })
  },
  fetchMealPlans() {
    return request('/meal-plans').then((rows) =>
      rows.map((p) => ({
        id: p.id,
        date: p.date,
        meal: p.meal,
        servings: p.servings ?? null,
        recipeId: p.recipe_id,
        recipeName: p.recipe_name,
        recipeEmoji: p.recipe_emoji
      }))
    )
  },
  createMealPlan(payload) {
    return request('/meal-plans', { method: 'POST', body: payload })
  },
  removeMealPlan(id) {
    return request(`/meal-plans/${id}`, { method: 'DELETE' })
  },
  addMealPlansToList(listId, { from, to, planIds, itemIds } = {}) {
    return request('/meal-plans/add-to-list', {
      method: 'POST',
      body: { listId, from, to, planIds, itemIds }
    })
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
