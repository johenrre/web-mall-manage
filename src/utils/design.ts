export interface DesignMaterial {
  id: string
  name: string
  image: string
  size: number
  price: number
  count: number
  subtotal: number
  missing: boolean
  [key: string]: unknown
}

export interface DesignSequenceItem extends Record<string, unknown> {
  id: string
  name: string
  image: string
  index: number
}

function patternOf(record: Record<string, unknown> | undefined): unknown[] {
  const value = record?.pattern
  if (Array.isArray(value)) return value
  if (typeof value !== 'string' || value.trim() === '') return []
  try {
    const parsed: unknown = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function normalizeMaterialId(item: unknown): string {
  if (item && typeof item === 'object') {
    const value = item as Record<string, unknown>
    return normalizeMaterialId(
      value.mat ?? value.materialId ?? value.material_id ?? value.id ?? value.code,
    )
  }
  return String(item ?? '').trim().replace(/^dynamic_/i, '')
}

function materialMapOf(record: Record<string, unknown> | undefined): Record<string, Record<string, unknown>> {
  const value = record?.material_map ?? record?.materialMap
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, Record<string, unknown>>
    : {}
}

function materialById(
  map: Record<string, Record<string, unknown>>,
  id: string,
): Record<string, unknown> {
  return map[id] ?? map[`dynamic_${id}`] ?? {}
}

export function designMaterials(record: Record<string, unknown> | undefined): DesignMaterial[] {
  const pattern = patternOf(record)
  const map = materialMapOf(record)
  const counts = new Map<string, number>()
  pattern.forEach((item) => {
    const id = normalizeMaterialId(item)
    if (id) counts.set(id, (counts.get(id) ?? 0) + 1)
  })

  return Array.from(counts.entries()).map(([id, count]) => {
    const material = materialById(map, id)
    const price = Number(material.price ?? 0)
    const missing = Object.keys(material).length === 0
    return {
      ...material,
      id,
      name: String(material.name ?? (missing ? '已删除的珠材' : '未命名珠材')),
      image: String(material.image ?? material.imageUrl ?? ''),
      size: Number(material.size ?? material.mm ?? 0),
      price: Number.isFinite(price) ? price : 0,
      count,
      subtotal: Number.isFinite(price) ? Math.round(price * count * 100) / 100 : 0,
      missing,
    }
  })
}

export function designSequence(
  record: Record<string, unknown> | undefined,
): DesignSequenceItem[] {
  const map = materialMapOf(record)
  return patternOf(record).map((entry, index) => {
    const id = normalizeMaterialId(entry)
    const material = materialById(map, id)
    return {
      ...material,
      id,
      index,
      name: String(material.name ?? '已删除的珠材'),
      image: String(material.image ?? material.imageUrl ?? ''),
    }
  })
}

export function designPhotos(record: Record<string, unknown> | undefined): string[] {
  const value = record?.live_photos ?? record?.productPhotos ?? []
  if (Array.isArray(value)) return value.map(String).filter(Boolean)
  if (typeof value !== 'string' || value.trim() === '') return []
  try {
    const parsed: unknown = JSON.parse(value)
    return Array.isArray(parsed) ? parsed.map(String).filter(Boolean) : []
  } catch {
    return []
  }
}
