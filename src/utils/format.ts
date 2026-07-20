import dayjs from 'dayjs'

export function money(value: unknown): string {
  const amount = Number(value || 0)
  return `¥${Number.isFinite(amount) ? amount.toFixed(2) : '0.00'}`
}

export function dateTime(value: unknown): string {
  if (!value) return '—'
  const date = dayjs(String(value))
  return date.isValid() ? date.format('YYYY-MM-DD HH:mm') : String(value)
}

export function listFrom<T = any>(data: any, keys = ['list', 'items', 'orders', 'data']): T[] {
  if (Array.isArray(data)) return data
  for (const key of keys) if (Array.isArray(data?.[key])) return data[key]
  return []
}

export function totalFrom(data: any, fallback = 0): number {
  return Number(data?.total ?? data?.pagination?.total ?? fallback)
}

export function resolveMedia(url: unknown): string {
  const value = String(url || '').trim()
  if (!value) return ''
  if (/^(https?:|data:|blob:)/i.test(value)) return value
  return value.startsWith('/') ? value : `/${value}`
}

export const orderStatus: Record<string, { text: string; color: string }> = {
  pending: { text: '待付款', color: 'orange' },
  paid: { text: '待发货', color: 'gold' },
  shipped: { text: '已发货', color: 'blue' },
  completed: { text: '已完成', color: 'green' },
  cancelled: { text: '已取消', color: 'default' },
  refund: { text: '售后中', color: 'red' },
}

export const reviewStatus: Record<string, { text: string; color: string }> = {
  pending: { text: '待审核', color: 'gold' },
  approved: { text: '已通过', color: 'green' },
  rejected: { text: '已拒绝', color: 'red' },
  private: { text: '未发布', color: 'default' },
}
