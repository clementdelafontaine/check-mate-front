import { defineStore } from 'pinia'
import { api } from '../services/api.js'

const STORAGE_KEY = 'checkmate-recipes-v1'

function loadLocal() {
  if (api.useApi) return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export const useRecipesStore = defineStore('recipes', {
  state: () => {
    if (api.useApi) return { recipes: [], mealPlans: [] }
    const saved = loadLocal()
    return { recipes: saved?.recipes ?? [], mealPlans: saved?.mealPlans ?? [] }
  },
  getters: {
    recipeById: (state) => (id) => state.recipes.find((r) => r.id === id),
    mealPlansByDate: (state) => (date) => state.mealPlans.filter((p) => p.date === date)
  },
  actions: {
    persist() {
      if (api.useApi) return
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ recipes: this.recipes, mealPlans: this.mealPlans })
        )
      } catch {
        /* storage unavailable */
      }
    },
    async refresh() {
      if (!api.useApi) return
      const [recipes, mealPlans] = await Promise.all([
        api.fetchRecipes(),
        api.fetchMealPlans()
      ])
      this.recipes = recipes
      this.mealPlans = mealPlans
    },
    async createRecipe(payload) {
      if (api.useApi) {
        const recipe = await api.createRecipe(payload)
        await this.refresh()
        return recipe
      }
      const recipe = {
        id: `r-${Date.now().toString(36)}`,
        name: payload.name,
        emoji: payload.emoji ?? '🍳',
        description: payload.description ?? '',
        servings: payload.servings ?? null,
        prepMinutes: payload.prepMinutes ?? null,
        cookMinutes: payload.cookMinutes ?? null,
        source: payload.source ?? null,
        sections: (payload.sections ?? [{ name: 'Ingrédients', items: [] }]).map((s) => ({
          id: `rs-${Math.random().toString(36).slice(2, 8)}`,
          name: s.name,
          items: s.items.map((i) => ({ id: `ri-${Math.random().toString(36).slice(2, 8)}`, label: i.label, quantity: i.quantity ?? null }))
        })),
        steps: (payload.steps ?? []).map((t) => ({ id: `rst-${Math.random().toString(36).slice(2, 8)}`, text: t })),
        itemCount: (payload.sections ?? []).reduce((n, s) => n + (s.items?.length ?? 0), 0)
      }
      this.recipes.unshift(recipe)
      this.persist()
      return recipe
    },
    async updateRecipe(id, patch) {
      if (api.useApi) {
        const recipe = await api.updateRecipe(id, patch)
        await this.refresh()
        return recipe
      }
      const idx = this.recipes.findIndex((r) => r.id === id)
      if (idx === -1) return null
      const merged = {
        ...this.recipes[idx],
        ...Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined))
      }
      if (patch.sections !== undefined) {
        merged.sections = patch.sections.map((s) => ({
          id: s.id ?? `rs-${Math.random().toString(36).slice(2, 8)}`,
          name: s.name,
          items: s.items.map((i) => ({ id: i.id ?? `ri-${Math.random().toString(36).slice(2, 8)}`, label: i.label, quantity: i.quantity ?? null }))
        }))
        merged.itemCount = patch.sections.reduce((n, s) => n + (s.items?.length ?? 0), 0)
      }
      if (patch.steps !== undefined) {
        merged.steps = patch.steps.map((t) => ({ id: `rst-${Math.random().toString(36).slice(2, 8)}`, text: t }))
      }
      this.recipes[idx] = merged
      this.persist()
      return merged
    },
    async removeRecipe(id) {
      const index = this.recipes.findIndex((r) => r.id === id)
      if (index === -1) return null
      const [removed] = this.recipes.splice(index, 1)
      if (api.useApi) {
        try {
          await api.removeRecipe(id)
        } catch {
          this.recipes.splice(index, 0, removed)
          return null
        }
      } else {
        this.persist()
      }
      return { recipe: removed, index }
    },
    restoreRecipe(payload) {
      if (!payload) return
      this.recipes.splice(Math.min(payload.index, this.recipes.length), 0, payload.recipe)
      if (api.useApi) {
        const r = payload.recipe
        api.createRecipe({
          name: r.name,
          emoji: r.emoji,
          description: r.description,
          servings: r.servings,
          prepMinutes: r.prepMinutes,
          cookMinutes: r.cookMinutes,
          source: r.source,
          sections: (r.sections ?? []).map((s) => ({
            name: s.name,
            items: s.items.map((i) => ({ label: i.label, quantity: i.quantity }))
          })),
          steps: (r.steps ?? []).map((s) => s.text)
        }).catch(() => {})
      } else {
        this.persist()
      }
    },
    async planMeal({ date, meal = 'dinner', servings = null, recipeId }) {
      if (api.useApi) {
        await api.createMealPlan({ date, meal, servings, recipeId })
        await this.refresh()
        return
      }
      if (this.mealPlans.some((p) => p.date === date && p.meal === meal)) return
      const recipe = this.recipes.find((r) => r.id === recipeId)
      this.mealPlans.push({
        id: `mp-${Date.now().toString(36)}`,
        date,
        meal,
        servings,
        recipeId,
        recipeName: recipe?.name,
        recipeEmoji: recipe?.emoji
      })
      this.persist()
    },
    async removeMealPlan(id) {
      const index = this.mealPlans.findIndex((p) => p.id === id)
      if (index === -1) return null
      const [removed] = this.mealPlans.splice(index, 1)
      if (api.useApi) {
        try {
          await api.removeMealPlan(id)
        } catch {
          this.mealPlans.splice(index, 0, removed)
          return null
        }
      } else {
        this.persist()
      }
      return removed
    },
    async addRecipeToList(recipeId, listId) {
      const checklists = (await import('./checklists.js')).useChecklistsStore()
      if (!api.useApi) {
        this.pushIngredientsToLocalList([this.recipeById(recipeId)], listId, checklists)
        return { added: true }
      }
      const result = await api.addRecipeToList(recipeId, listId)
      await checklists.refresh?.()
      return result
    },
    async addMealPlansToList(listId, { from, to, planIds } = {}) {
      const checklists = (await import('./checklists.js')).useChecklistsStore()
      if (!api.useApi) {
        const plans = this.mealPlans.filter(
          (p) =>
            (!from || p.date >= from) &&
            (!to || p.date <= to) &&
            (!planIds || planIds.includes(p.id))
        )
        const recipes = plans
          .map((p) => this.recipeById(p.recipeId))
          .filter(Boolean)
        this.pushIngredientsToLocalList(recipes, listId, checklists)
        return { added: true, meals: plans.length }
      }
      const result = await api.addMealPlansToList(listId, { from, to, planIds })
      await checklists.refresh?.()
      return result
    },
    pushIngredientsToLocalList(recipes, listId, checklists) {
      const list = checklists.lists.find((l) => l.id === listId)
      if (!list) return
      const seen = new Set()
      for (const recipe of recipes) {
        for (const section of recipe.sections ?? []) {
          let target = list.sections.find(
            (s) => s.name.toLowerCase() === section.name.toLowerCase()
          )
          if (!target) {
            target = {
              id: `s-${Math.random().toString(36).slice(2, 8)}`,
              name: section.name,
              items: []
            }
            list.sections.push(target)
          }
          for (const item of section.items ?? []) {
            const key = `${section.name.toLowerCase()}::${item.label.toLowerCase()}`
            if (seen.has(key)) continue
            seen.add(key)
            target.items.push({
              id: `i-${Math.random().toString(36).slice(2, 8)}`,
              label: item.label,
              kind: 'product',
              quantity: item.quantity ?? null,
              checked: false
            })
          }
        }
      }
      checklists.persist?.()
    }
  }
})
