import { query, one, uid, listWithSections } from '../db.js'

async function setPosition(table, col, id, value) {
  await query(`UPDATE ${table} SET position = $2 WHERE id = $1`, [id, value])
}

export async function listsRoutes(app) {
  app.get('/lists', async () => {
    const { rows } = await query(
      'SELECT id FROM lists ORDER BY position DESC, created_at DESC'
    )
    const lists = await Promise.all(rows.map((r) => listWithSections(r.id)))
    return lists
  })

  app.get('/lists/:id', async (req, reply) => {
    const list = await listWithSections(req.params.id)
    if (!list) return reply.code(404).send({ error: 'not found' })
    return list
  })

  app.post('/lists', async (req, reply) => {
    const {
      name,
      emoji = '📋',
      type = 'checklist',
      spaceId = null,
      labelIds = [],
      startDate = null,
      endDate = null,
      templateId = null
    } = req.body ?? {}
    if (!name?.trim()) return reply.code(400).send({ error: 'name required' })

    const list = await one(
      `INSERT INTO lists (id, name, emoji, type, space_id, start_date, end_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [uid('l'), name.trim(), emoji, type, spaceId, startDate, endDate]
    )

    if (templateId) {
      const { rows: tplSections } = await query(
        'SELECT * FROM template_sections WHERE template_id = $1 ORDER BY position, id',
        [templateId]
      )
      for (const [idx, ts] of tplSections.entries()) {
        const section = await one(
          'INSERT INTO sections (id, list_id, name, position) VALUES ($1, $2, $3, $4) RETURNING *',
          [uid('s'), list.id, ts.name, idx]
        )
        const { rows: tplItems } = await query(
          'SELECT * FROM template_items WHERE section_id = $1 ORDER BY position, id',
          [ts.id]
        )
        for (const [i, ti] of tplItems.entries()) {
          await query(
            `INSERT INTO items (id, section_id, label, kind, quantity, position)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [uid('i'), section.id, ti.label, ti.kind, ti.quantity, i]
          )
        }
      }
    } else {
      await query(
        `INSERT INTO sections (id, list_id, name, position) VALUES ($1, $2, $3, 0)`,
        [uid('s'), list.id, 'Divers']
      )
    }

    for (const labelId of labelIds) {
      await query(
        'INSERT INTO list_labels (list_id, label_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [list.id, labelId]
      )
    }

    return reply.code(201).send(await listWithSections(list.id))
  })

  app.patch('/lists/:id', async (req, reply) => {
    const {
      name,
      emoji,
      type,
      spaceId,
      labelIds,
      startDate,
      endDate
    } = req.body ?? {}
    const existing = await one('SELECT * FROM lists WHERE id = $1', [req.params.id])
    if (!existing) return reply.code(404).send({ error: 'not found' })

    await query(
      `UPDATE lists SET
         name = COALESCE($2, name),
         emoji = COALESCE($3, emoji),
         type = COALESCE($4, type),
         space_id = $5,
         start_date = $6,
         end_date = $7,
         updated_at = now()
       WHERE id = $1`,
      [
        req.params.id,
        name?.trim() || null,
        emoji || null,
        type || null,
        spaceId === undefined ? existing.space_id : spaceId,
        startDate === undefined ? existing.start_date : startDate,
        endDate === undefined
          ? existing.end_date ?? startDate ?? existing.start_date
          : endDate
      ]
    )

    if (labelIds !== undefined) {
      await query('DELETE FROM list_labels WHERE list_id = $1', [req.params.id])
      for (const labelId of labelIds) {
        await query(
          'INSERT INTO list_labels (list_id, label_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [req.params.id, labelId]
        )
      }
    }

    return listWithSections(req.params.id)
  })

  app.delete('/lists/:id', async (req, reply) => {
    const { rowCount } = await query('DELETE FROM lists WHERE id = $1', [req.params.id])
    if (!rowCount) return reply.code(404).send({ error: 'not found' })
    return reply.code(204).send()
  })

  app.post('/lists/:id/duplicate', async (req, reply) => {
    const source = await listWithSections(req.params.id)
    if (!source) return reply.code(404).send({ error: 'not found' })
    const created = await one(
      `INSERT INTO lists (id, name, emoji, type, space_id, start_date, end_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        uid('l'),
        `${source.name} (copie)`,
        source.emoji,
        source.type,
        source.space_id,
        source.start_date,
        source.end_date
      ]
    )
    for (const [si, section] of source.sections.entries()) {
      const sectionRow = await one(
        'INSERT INTO sections (id, list_id, name, position) VALUES ($1, $2, $3, $4) RETURNING *',
        [uid('s'), created.id, section.name, si]
      )
      for (const [ii, item] of section.items.entries()) {
        await query(
          `INSERT INTO items (id, section_id, label, kind, quantity, checked, position)
           VALUES ($1, $2, $3, $4, $5, false, $6)`,
          [uid('i'), sectionRow.id, item.label, item.kind, item.quantity, ii]
        )
      }
    }
    for (const labelId of source.labelIds ?? []) {
      await query(
        'INSERT INTO list_labels (list_id, label_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [created.id, labelId]
      )
    }
    return reply.code(201).send(await listWithSections(created.id))
  })

  app.post('/lists/:id/template', async (req, reply) => {
    const source = await listWithSections(req.params.id)
    if (!source) return reply.code(404).send({ error: 'not found' })
    const tpl = await one(
      `INSERT INTO templates (id, name, emoji, description, type)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [uid('t'), source.name, source.emoji, 'Créé depuis une liste', source.type]
    )
    for (const [si, section] of source.sections.entries()) {
      const sectionRow = await one(
        'INSERT INTO template_sections (id, template_id, name, position) VALUES ($1, $2, $3, $4) RETURNING *',
        [uid('ts'), tpl.id, section.name, si]
      )
      for (const [ii, item] of section.items.entries()) {
        await query(
          `INSERT INTO template_items (id, section_id, label, kind, quantity, position)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [uid('ti'), sectionRow.id, item.label, item.kind, item.quantity, ii]
        )
      }
    }
    return reply.code(201).send({ id: tpl.id })
  })

  app.post('/lists/:id/clear-checked', async (req, reply) => {
    const list = await listWithSections(req.params.id)
    if (!list) return reply.code(404).send({ error: 'not found' })
    const removed = []
    for (const section of list.sections) {
      for (const item of section.items.filter((i) => i.checked)) {
        removed.push({ ...item, sectionId: section.id })
        await query('DELETE FROM items WHERE id = $1', [item.id])
      }
    }
    return { removed }
  })

  app.post('/lists/:id/reset', async (req, reply) => {
    const { rowCount } = await query(
      `UPDATE items SET checked = false
       WHERE section_id IN (SELECT id FROM sections WHERE list_id = $1)`,
      [req.params.id]
    )
    return { updated: rowCount }
  })

  app.post('/lists/:id/labels/:labelId/toggle', async (req, reply) => {
    const existing = await one(
      'SELECT 1 FROM list_labels WHERE list_id = $1 AND label_id = $2',
      [req.params.id, req.params.labelId]
    )
    if (existing) {
      await query('DELETE FROM list_labels WHERE list_id = $1 AND label_id = $2', [
        req.params.id,
        req.params.labelId
      ])
      return { attached: false }
    }
    await query(
      'INSERT INTO list_labels (list_id, label_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [req.params.id, req.params.labelId]
    )
    return { attached: true }
  })

  app.post('/lists/:id/sections', async (req, reply) => {
    const list = await one('SELECT id FROM lists WHERE id = $1', [req.params.id])
    if (!list) return reply.code(404).send({ error: 'not found' })
    const { name = 'Divers' } = req.body ?? {}
    const { rows: last } = await query(
      'SELECT COALESCE(MAX(position), -1) + 1 AS next FROM sections WHERE list_id = $1',
      [req.params.id]
    )
    const section = await one(
      'INSERT INTO sections (id, list_id, name, position) VALUES ($1, $2, $3, $4) RETURNING *',
      [uid('s'), req.params.id, name, last[0].next]
    )
    return reply.code(201).send(section)
  })

  app.post('/sections/:sectionId/items', async (req, reply) => {
    const section = await one('SELECT * FROM sections WHERE id = $1', [req.params.sectionId])
    if (!section) return reply.code(404).send({ error: 'not found' })
    const { label, kind = 'task', quantity = null } = req.body ?? {}
    if (!label?.trim()) return reply.code(400).send({ error: 'label required' })
    const { rows: last } = await query(
      'SELECT COALESCE(MAX(position), -1) + 1 AS next FROM items WHERE section_id = $1',
      [req.params.sectionId]
    )
    const item = await one(
      `INSERT INTO items (id, section_id, label, kind, quantity, position)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [uid('i'), req.params.sectionId, label.trim(), kind, quantity, last[0].next]
    )
    await query(
      `INSERT INTO item_frequency (label, count) VALUES ($1, 1)
       ON CONFLICT (label) DO UPDATE SET count = item_frequency.count + 1`,
      [label.trim().toLowerCase()]
    )
    return reply.code(201).send(item)
  })

  app.patch('/items/:itemId', async (req, reply) => {
    const { label, kind, quantity, checked } = req.body ?? {}
    const existing = await one('SELECT * FROM items WHERE id = $1', [req.params.itemId])
    if (!existing) return reply.code(404).send({ error: 'not found' })
    const item = await one(
      `UPDATE items SET
         label = COALESCE($2, label),
         kind = COALESCE($3, kind),
         quantity = CASE WHEN $5 THEN $4 ELSE quantity END,
         checked = COALESCE($6, checked)
       WHERE id = $1 RETURNING *`,
      [
        req.params.itemId,
        label?.trim() || null,
        kind || null,
        kind === 'task' ? null : quantity,
        quantity !== undefined,
        checked ?? null
      ]
    )
    return item
  })

  app.delete('/items/:itemId', async (req, reply) => {
    const item = await one('DELETE FROM items WHERE id = $1 RETURNING *', [req.params.itemId])
    if (!item) return reply.code(404).send({ error: 'not found' })
    return item
  })

  app.post('/items/:itemId/move', async (req, reply) => {
    const { toSectionId } = req.body ?? {}
    const target = await one('SELECT id FROM sections WHERE id = $1', [toSectionId])
    if (!target) return reply.code(404).send({ error: 'target section not found' })
    const item = await one('UPDATE items SET section_id = $2 WHERE id = $1 RETURNING *', [
      req.params.itemId,
      toSectionId
    ])
    if (!item) return reply.code(404).send({ error: 'not found' })
    return item
  })
}
