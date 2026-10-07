const UNIT_ALIASES = {
  l: 'L', dl: 'dL', cl: 'cL', ml: 'mL',
  g: 'g', kg: 'kg', mg: 'mg',
  tranches: 'tranches', tranche: 'tranches',
  pieces: 'pièces', piece: 'pièces', pcs: 'pièces',
  botte: 'botte', bottes: 'botte',
  sachet: 'sachet', sachets: 'sachet',
  boite: 'boîte', boites: 'boîtes', boîte: 'boîte', boîtes: 'boîtes'
}

export const UNITS = ['g', 'kg', 'mL', 'L']

const QUANTITY_RE = /^([0-9]+(?:[.,][0-9]+)?)\s*(.*)$/

export function parseQuantity(value) {
  if (value === null || value === undefined || value === '') return { n: null, unit: null }
  const s = String(value).trim()
  const m = s.match(QUANTITY_RE)
  if (!m) return { n: null, unit: null }
  const n = Number(m[1].replace(',', '.'))
  const rawUnit = m[2].trim()
  const unit = rawUnit ? UNIT_ALIASES[rawUnit.toLowerCase()] ?? rawUnit : ''
  return { n: Number.isFinite(n) ? n : null, unit }
}

export function hasUnit(value) {
  return parseQuantity(value).unit !== null && parseQuantity(value).unit !== ''
}

export function formatQuantity(n, unit) {
  const rounded = Math.round(n * 1000) / 1000
  return unit ? `${rounded} ${unit}` : `${rounded}`
}

export function stepQuantity(value, delta, { min = 0 } = {}) {
  const { n, unit } = parseQuantity(value)
  if (n === null) return formatQuantity(1 + Math.max(0, delta - 1), unit || '')
  const next = Math.max(min, n + delta)
  return formatQuantity(next, unit || '')
}

export function displayQuantity(value) {
  const { n, unit } = parseQuantity(value)
  if (n === null) return null
  return unit ? `${Math.round(n * 100) / 100} ${unit}` : `${Math.round(n * 100) / 100}`
}
