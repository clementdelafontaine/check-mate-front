import { query, one, uid, recipeWithSections } from '../db.js'
import { sumQuantityTexts } from '../quantity.js'

export async function mealPlansRoutes(app) {
  app.get('/meal-plans', async (req) => {
    const { rows } = await query(
      `SELECT mp.*, r.name AS recipe_name, r.emoji AS recipe_emoji
       FROM meal_plans mp
       JOIN recipes r ON r.id = mp.recipe_id
       WHERE mp.user_id = $1
       ORDER BY mp.date, mp.meal`,
      [req.user.id]
    )
    return rows
  })

  app.post(
    '/meal-plans',
    {
      schema: {
        body: {
          type: 'object',
          required: ['date', 'recipeId'],
          properties: {
            date: { type: 'string', format: 'date' },
            meal: { type: 'string', enum: ['lunch', 'dinner'] },
            servings: { type: 'integer', nullable: true },
            recipeId: { type: 'string' }
          }
        }
      }
    },
    async (req, reply) => {
      const { date, meal = 'dinner', servings = null, recipeId } = req.body ?? {}
      const recipe = await one('SELECT id FROM recipes WHERE id = $1 AND user_id = $2', [
        recipeId,
        req.user.id
      ])
      if (!recipe) return reply.code(404).send({ error: 'recipe not found' })
      const plan = await one(
        `INSERT INTO meal_plans (id, date, meal, servings, recipe_id, user_id)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT DO NOTHING
         RETURNING *`,
        [uid('mp'), date, meal, servings, recipeId, req.user.id]
      )
      if (!plan) {
        return reply.code(409).send({ error: 'meal already planned for this date and meal' })
      }
      return reply.code(201).send(plan)
    }
  )

  app.delete('/meal-plans/:id', async (req, reply) => {
    const { rowCount } = await query('DELETE FROM meal_plans WHERE id = $1 AND user_id = $2', [
      req.params.id,
      req.user.id
    ])
    if (!rowCount) return reply.code(404).send({ error: 'not found' })
    return reply.code(204).send()
  })

  app.post(
    '/meal-plans/add-to-list',
    {
      schema: {
        body: {
          type: 'object',
          required: ['listId'],
          properties: {
            listId: { type: 'string' },
            from: { type: 'string', format: 'date', nullable: true },
            to: { type: 'string', format: 'date', nullable: true },
            planIds: { type: 'array', items: { type: 'string' }, nullable: true },
            itemIds: { type: 'array', items: { type: 'string' }, nullable: true }
          }
        }
      }
    },
    async (req, reply) => {
      const { listId, from = null, to = null, planIds = null, itemIds = null } = req.body ?? {}
      const include = itemIds === null ? null : new Set(itemIds)
      const list = await one(
        'SELECT id FROM lists WHERE id = $1 AND user_id = $2 AND type = \'grocery\'',
        [listId, req.user.id]
      )
      if (!list) return reply.code(404).send({ error: 'grocery list not found' })
      const { rows: plans } = await query(
        `SELECT mp.*, r.name AS recipe_name FROM meal_plans mp
         JOIN recipes r ON r.id = mp.recipe_id
         WHERE mp.user_id = $1
           AND ($2::date IS NULL OR mp.date >= $2)
           AND ($3::date IS NULL OR mp.date <= $3)
           AND ($4::text[] IS NULL OR mp.id = ANY($4))`,
        [req.user.id, from, to, planIds]
      )
      if (!plans.length) return reply.code(400).send({ error: 'no meals planned in range' })
      let added = 0
      const seen = new Map()
      for (const plan of plans) {
        const recipe = await recipeWithSections(plan.recipe_id, req.user.id)
        if (!recipe) continue
        for (const section of recipe.sections) {
          const allItems = section.items ?? []
          if (include !== null) {
            section.items = section.items.filter((it) => include.has(it.id))
          }
          if (!section.items?.length && allItems.length) continue
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
          for (const item of section.items) {
            const key = `${section.name.toLowerCase()}::${item.label.toLowerCase()}`
            if (seen.has(key)) continue
            const existing = await one(
              `SELECT id, quantity FROM items
               WHERE section_id = $1 AND lower(label) = lower($2)`,
              [target.id, item.label]
            )
            if (existing) {
              const sum = sumQuantityTexts(existing.quantity, item.quantity)
              if (sum.merged) {
                if (sum.value !== null) {
                  await query('UPDATE items SET quantity = $2 WHERE id = $1', [
                    existing.id,
                    sum.value
                  ])
                }
                seen.set(key, true)
                added++
                continue
              }
            }
            const { rows: last } = await query(
              'SELECT COALESCE(MAX(position), -1) + 1 AS next FROM items WHERE section_id = $1',
              [target.id]
            )
            await query(
              `INSERT INTO items (id, section_id, label, kind, quantity, position)
               VALUES ($1, $2, $3, 'product', $4, $5)`,
              [uid('i'), target.id, item.label, item.quantity ?? null, last[0].next]
            )
            seen.set(key, true)
            added++
          }
        }
      }
      return reply.code(201).send({ added, meals: plans.length })
    }
  )
}
