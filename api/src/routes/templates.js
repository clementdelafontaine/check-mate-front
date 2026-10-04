import { query, one, uid, templateWithSections } from '../db.js'

export async function templatesRoutes(app) {
  app.get('/templates', async (req) => {
    const { rows } = await query(
      'SELECT id FROM templates WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    )
    const templates = await Promise.all(rows.map((r) => templateWithSections(r.id)))
    return templates
  })

  app.get('/templates/:id', async (req, reply) => {
    const tpl = await templateWithSections(req.params.id)
    if (!tpl) return reply.code(404).send({ error: 'not found' })
    return tpl
  })

  app.post('/templates', async (req, reply) => {
    const { name, emoji = '✨', description = '', type = 'checklist' } = req.body ?? {}
    if (!name?.trim()) return reply.code(400).send({ error: 'name required' })
    const tpl = await one(
      `INSERT INTO templates (id, name, emoji, description, type, user_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [uid('t'), name.trim(), emoji, description, type, req.user.id]
    )
    return reply.code(201).send(tpl)
  })

  app.delete('/templates/:id', async (req, reply) => {
    const { rowCount } = await query(
      'DELETE FROM templates WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    )
    if (!rowCount) return reply.code(404).send({ error: 'not found' })
    return reply.code(204).send()
  })

  app.post('/templates/:id/sections', async (req, reply) => {
    const tpl = await one('SELECT id FROM templates WHERE id = $1 AND user_id = $2', [
      req.params.id,
      req.user.id
    ])
    if (!tpl) return reply.code(404).send({ error: 'not found' })
    const { name = 'Divers' } = req.body ?? {}
    const { rows: last } = await query(
      'SELECT COALESCE(MAX(position), -1) + 1 AS next FROM template_sections WHERE template_id = $1',
      [req.params.id]
    )
    const section = await one(
      'INSERT INTO template_sections (id, template_id, name, position) VALUES ($1, $2, $3, $4) RETURNING *',
      [uid('ts'), req.params.id, name, last[0].next]
    )
    return reply.code(201).send(section)
  })

  app.post('/template-sections/:sectionId/items', async (req, reply) => {
    const section = await one(
      `SELECT ts.* FROM template_sections ts
       JOIN templates t ON t.id = ts.template_id
       WHERE ts.id = $1 AND t.user_id = $2`,
      [req.params.sectionId, req.user.id]
    )
    if (!section) return reply.code(404).send({ error: 'not found' })
    const { label, kind = 'task', quantity = null } = req.body ?? {}
    if (!label?.trim()) return reply.code(400).send({ error: 'label required' })
    const { rows: last } = await query(
      'SELECT COALESCE(MAX(position), -1) + 1 AS next FROM template_items WHERE section_id = $1',
      [req.params.sectionId]
    )
    const item = await one(
      `INSERT INTO template_items (id, section_id, label, kind, quantity, position)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [uid('ti'), req.params.sectionId, label.trim(), kind, quantity, last[0].next]
    )
    return reply.code(201).send(item)
  })

  app.delete('/template-items/:itemId', async (req, reply) => {
    const item = await one(
      `DELETE FROM template_items WHERE id = $1
       AND section_id IN (
         SELECT ts.id FROM template_sections ts
         JOIN templates t ON t.id = ts.template_id
         WHERE t.user_id = $2
       ) RETURNING *`,
      [req.params.itemId, req.user.id]
    )
    if (!item) return reply.code(404).send({ error: 'not found' })
    return item
  })
}
