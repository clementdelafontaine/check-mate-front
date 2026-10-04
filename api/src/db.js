import pg from 'pg'
import { config } from './config.js'

const pool = new pg.Pool({ connectionString: config.databaseUrl, max: 10 })

export const query = (text, params) => pool.query(text, params)

export const one = async (text, params) => {
  const { rows } = await query(text, params)
  return rows[0] ?? null
}

export const uid = (prefix) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

export const listWithSections = async (listId, userId = null) => {
  const list = await one(
    `SELECT l.*, COALESCE(
       json_agg(
         json_build_object(
           'id', s.id, 'name', s.name,
           'items', (
             SELECT COALESCE(json_agg(
               json_build_object(
                 'id', i.id, 'label', i.label, 'kind', i.kind,
                 'quantity', i.quantity, 'checked', i.checked
               ) ORDER BY i.position, i.created_at
             ), '[]')
             FROM items i WHERE i.section_id = s.id
           )
         ) ORDER BY s.position, s.id
       ), '[]'
     ) AS sections,
     COALESCE((
       SELECT json_agg(ll.label_id) FROM list_labels ll WHERE ll.list_id = l.id
     ), '[]') AS label_ids
     FROM lists l
     LEFT JOIN sections s ON s.list_id = l.id
     WHERE l.id = $1 AND ($2::text IS NULL OR l.user_id = $2)
     GROUP BY l.id`,
    [listId, userId]
  )
  if (!list) return null
  return {
    ...list,
    labelIds: list.label_ids,
    sections: list.sections
  }
}

export const templateWithSections = async (templateId, userId = null) => {
  const tpl = await one(
    `SELECT t.*, COALESCE(
       json_agg(
         json_build_object(
           'id', s.id, 'name', s.name,
           'items', (
             SELECT COALESCE(json_agg(
               json_build_object(
                 'id', i.id, 'label', i.label, 'kind', i.kind, 'quantity', i.quantity
               ) ORDER BY i.position, i.id
             ), '[]')
             FROM template_items i WHERE i.section_id = s.id
           )
         ) ORDER BY s.position, s.id
       ), '[]'
     ) AS sections
     FROM templates t
     LEFT JOIN template_sections s ON s.template_id = t.id
     WHERE t.id = $1 AND ($2::text IS NULL OR t.user_id = $2)
     GROUP BY t.id`,
    [templateId, userId]
  )
  if (!tpl) return null
  return { ...tpl, sections: tpl.sections }
}
