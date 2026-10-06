const QUANTITY_RE = /^([0-9]+(?:[.,][0-9]+)?)\s*(.*)$/

export function parseQuantity(value) {
  if (value === null || value === undefined) return { n: null, unit: null }
  if (typeof value !== 'string') return { n: null, unit: null }
  const m = value.trim().match(QUANTITY_RE)
  if (!m) return { n: null, unit: null }
  return { n: Number(m[1].replace(',', '.')), unit: m[2].trim() }
}

export function sumQuantityTexts(a, b) {
  const pa = parseQuantity(a)
  const pb = parseQuantity(b)
  if (pa.n === null && pb.n === null) return { merged: true, value: null }
  if (pa.n === null) return { merged: true, value: b }
  if (pb.n === null) return { merged: true, value: a }
  if (pa.unit && pb.unit && pa.unit.toLowerCase() !== pb.unit.toLowerCase()) {
    return { merged: false }
  }
  const unit = pa.unit || pb.unit
  const sum = pa.n + pb.n
  const rounded = Math.round(sum * 1000) / 1000
  return { merged: true, value: unit ? `${rounded} ${unit}` : `${rounded}` }
}
