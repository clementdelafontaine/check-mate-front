import { query, one, uid, recipeWithSections } from '../db.js'

export async function recipesRoutes(app) {
  app.get('/recipes', async (req) => {
    const { rows } = await query(
      'SELECT id FROM recipes WHERE user_id = $1 ORDER BY position DESC, created_at DESC',
      [req.user.id]
    )
    const recipes = []
    for (const r of rows) {
      const recipe = await recipeWithSections(r.id, req.user.id)
      if (recipe) {
        recipes.push({
          ...recipe,
          item_count: recipe.sections.reduce(
            (n, s) => n + (s.items?.length ?? 0),
            0
          )
        })
      }
    }
    return recipes
  })

  app.get('/recipes/:id', async (req, reply) => {
    const recipe = await recipeWithSections(req.params.id, req.user.id)
    if (!recipe) return reply.code(404).send({ error: 'not found' })
    return recipe
  })

  app.post(
    '/recipes',
    {
      schema: {
        body: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string' },
            emoji: { type: 'string' },
            description: { type: 'string' },
            servings: { type: 'integer', nullable: true },
            prepMinutes: { type: 'integer', nullable: true },
            cookMinutes: { type: 'integer', nullable: true },
            source: { type: 'string', nullable: true },
            tags: { type: 'array', items: { type: 'string' } },
            sections: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  items: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        label: { type: 'string' },
                        quantity: { type: 'string', nullable: true }
                      }
                    }
                  }
                }
              }
            },
            steps: { type: 'array', items: { type: 'string' } }
          }
        }
      }
    },
    async (req, reply) => {
      const {
        name,
        emoji = '🍳',
        description = '',
        servings = null,
        prepMinutes = null,
        cookMinutes = null,
        source = null,
        tags = [],
        sections = [],
        steps = []
      } = req.body ?? {}
      if (!name?.trim()) return reply.code(400).send({ error: 'name required' })
      const recipe = await one(
        `INSERT INTO recipes (id, name, emoji, description, servings, prep_minutes, cook_minutes, source, tags, user_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
        [uid('r'), name.trim(), emoji, description, servings, prepMinutes, cookMinutes, source, tags, req.user.id]
      )
      const defaultSections = [
        { name: 'Produits frais', items: [] },
        { name: 'Épicerie', items: [] }
      ]
      for (const [si, s] of (sections.length ? sections : defaultSections).entries()) {
        const section = await one(
          'INSERT INTO recipe_sections (id, recipe_id, name, position) VALUES ($1, $2, $3, $4) RETURNING *',
          [uid('rs'), recipe.id, s.name ?? 'Divers', si]
        )
        for (const [ii, i] of (s.items ?? []).entries()) {
          if (!i.label?.trim()) continue
          await query(
            `INSERT INTO recipe_items (id, section_id, label, kind, quantity, position)
             VALUES ($1, $2, $3, 'product', $4, $5)`,
            [uid('rit'), section.id, i.label.trim(), i.quantity ?? null, ii]
          )
        }
      }
      for (const [idx, text] of steps.entries()) {
        if (!text?.trim()) continue
        await query(
          'INSERT INTO recipe_steps (id, recipe_id, text, position) VALUES ($1, $2, $3, $4)',
          [uid('rst'), recipe.id, text.trim(), idx]
        )
      }
      return reply.code(201).send(await recipeWithSections(recipe.id, req.user.id))
    }
  )

  app.patch('/recipes/:id', async (req, reply) => {
    const existing = await one('SELECT * FROM recipes WHERE id = $1 AND user_id = $2', [
      req.params.id,
      req.user.id
    ])
    if (!existing) return reply.code(404).send({ error: 'not found' })
    const {
      name,
      emoji,
      description,
      servings,
      prepMinutes,
      cookMinutes,
      source,
      tags,
      sections,
      steps
    } = req.body ?? {}
    await query(
      `UPDATE recipes SET
         name = COALESCE($2, name),
         emoji = COALESCE($3, emoji),
         description = COALESCE($4, description),
         servings = $5,
         prep_minutes = $6,
         cook_minutes = $7,
         source = $8,
         tags = COALESCE($9, tags),
         updated_at = now()
       WHERE id = $1`,
      [
        req.params.id,
        name?.trim() || null,
        emoji || null,
        description ?? null,
        servings === undefined ? existing.servings : servings,
        prepMinutes === undefined ? existing.prep_minutes : prepMinutes,
        cookMinutes === undefined ? existing.cook_minutes : cookMinutes,
        source === undefined ? existing.source : source,
        tags === undefined ? null : tags
      ]
    )
    if (sections !== undefined) {
      await query('DELETE FROM recipe_sections WHERE recipe_id = $1', [req.params.id])
      for (const [si, s] of sections.entries()) {
        const section = await one(
          'INSERT INTO recipe_sections (id, recipe_id, name, position) VALUES ($1, $2, $3, $4) RETURNING *',
          [uid('rs'), req.params.id, s.name ?? 'Divers', si]
        )
        for (const [ii, i] of (s.items ?? []).entries()) {
          if (!i.label?.trim()) continue
          await query(
            `INSERT INTO recipe_items (id, section_id, label, kind, quantity, position)
             VALUES ($1, $2, $3, 'product', $4, $5)`,
            [uid('rit'), section.id, i.label.trim(), i.quantity ?? null, ii]
          )
        }
      }
    }
    if (steps !== undefined) {
      await query('DELETE FROM recipe_steps WHERE recipe_id = $1', [req.params.id])
      for (const [idx, text] of steps.entries()) {
        if (!text?.trim()) continue
        await query(
          'INSERT INTO recipe_steps (id, recipe_id, text, position) VALUES ($1, $2, $3, $4)',
          [uid('rst'), req.params.id, text.trim(), idx]
        )
      }
    }
    return recipeWithSections(req.params.id, req.user.id)
  })

  app.delete('/recipes/:id', async (req, reply) => {
    const { rowCount } = await query('DELETE FROM recipes WHERE id = $1 AND user_id = $2', [
      req.params.id,
      req.user.id
    ])
    if (!rowCount) return reply.code(404).send({ error: 'not found' })
    return reply.code(204).send()
  })

  app.post(
    '/recipes/:id/add-to-list',
    {
      schema: {
        body: {
          type: 'object',
          required: ['listId'],
          properties: {
            listId: { type: 'string' },
            itemIds: { type: 'array', items: { type: 'string' }, nullable: true }
          }
        }
      }
    },
    async (req, reply) => {
      const { itemIds = null } = req.body ?? {}
      const include = itemIds === null ? null : new Set(itemIds)
      const recipe = await recipeWithSections(req.params.id, req.user.id)
      if (!recipe) return reply.code(404).send({ error: 'recipe not found' })
      const list = await one(
        `SELECT l.id FROM lists l
         WHERE l.id = $1 AND (l.user_id = $2 OR EXISTS (
           SELECT 1 FROM list_collaborators lc
           WHERE lc.list_id = l.id AND lc.user_id = $2
         ))`,
        [req.body.listId, req.user.id]
      )
      if (!list) return reply.code(404).send({ error: 'list not found' })
      let added = 0
      for (const section of recipe.sections) {
        const items = (section.items ?? []).filter(
          (it) =>
            typeof it.label === 'string' &&
            it.label.trim() !== '' &&
            (include === null || include.has(it.id))
        )
        if (!items.length) continue
        let target = await one(
          'SELECT id FROM sections WHERE list_id = $1 AND lower(name) = lower($2)',
          [list.id, section.name]
        )
        if (!target) {
          const { rows: last } = await query(
            'SELECT COALESCE(MAX(position), -1) + 1 AS next FROM sections WHERE list_id = $1',
            [list.id]
          )
          target = await one(
            'INSERT INTO sections (id, list_id, name, position) VALUES ($1, $2, $3, $4) RETURNING id',
            [uid('s'), list.id, section.name, last[0].next]
          )
        }
        for (const item of items) {
          const { rows: last } = await query(
            'SELECT COALESCE(MAX(position), -1) + 1 AS next FROM items WHERE section_id = $1',
            [target.id]
          )
          await query(
            `INSERT INTO items (id, section_id, label, kind, quantity, position)
             VALUES ($1, $2, $3, 'product', $4, $5)`,
            [uid('i'), target.id, item.label, item.quantity ?? null, last[0].next]
          )
          await query(
            `INSERT INTO item_frequency (label, count, user_id) VALUES ($1, 1, $2)
             ON CONFLICT (label, user_id) DO UPDATE SET count = item_frequency.count + 1`,
            [item.label.toLowerCase(), req.user.id]
          )
          added++
        }
      }
      return reply.code(201).send({ added })
    }
  )
}
