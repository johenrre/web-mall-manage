export interface BusinessPagePermission {
  key: string
  label: string
  group: '经营与用户' | '商品与内容'
}

export const BUSINESS_PAGE_PERMISSIONS: BusinessPagePermission[] = [
  { key: 'stats', label: '经营概览', group: '经营与用户' },
  { key: 'orders', label: '订单管理', group: '经营与用户' },
  { key: 'aftersales', label: '售后管理', group: '经营与用户' },
  { key: 'users', label: '用户管理', group: '经营与用户' },
  { key: 'products', label: '商品管理', group: '商品与内容' },
  { key: 'beads', label: '盘珠管理', group: '商品与内容' },
  { key: 'designs', label: '设计管理', group: '商品与内容' },
  { key: 'creators', label: '设计师管理', group: '商品与内容' },
]

export const BUSINESS_PAGE_KEYS = BUSINESS_PAGE_PERMISSIONS.map((page) => page.key)

