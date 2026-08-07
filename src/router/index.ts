import { createRouter, createWebHistory } from 'vue-router'
import { useAuth } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', name: 'login', component: () => import('@/views/LoginView.vue'), meta: { public: true, title: '管理员登录' } },
    {
      path: '/',
      component: () => import('@/layouts/AdminLayout.vue'),
      children: [
        { path: '', redirect: '/stats' },
        { path: 'stats', name: 'stats', component: () => import('@/views/StatsView.vue'), meta: { title: '经营概览', permission: 'stats' } },
        { path: 'orders', name: 'orders', component: () => import('@/views/OrdersView.vue'), meta: { title: '订单管理', permission: 'orders' } },
        { path: 'aftersales', name: 'aftersales', component: () => import('@/views/OrdersView.vue'), props: { aftersales: true }, meta: { title: '售后管理', permission: 'aftersales' } },
        { path: 'beads', name: 'beads', component: () => import('@/views/BeadsView.vue'), meta: { title: '盘珠管理', permission: 'beads' } },
        { path: 'products', name: 'products', component: () => import('@/views/ProductsView.vue'), meta: { title: '商品管理', permission: 'products' } },
        { path: 'coupons', name: 'coupons', component: () => import('@/views/CouponsView.vue'), meta: { title: '现金卡券', adminOnly: true } },
        { path: 'users', name: 'users', component: () => import('@/views/UsersView.vue'), meta: { title: '用户管理', permission: 'users' } },
        { path: 'designs', name: 'designs', component: () => import('@/views/DesignsView.vue'), meta: { title: '设计管理', permission: 'designs' } },
        { path: 'creators', name: 'creators', component: () => import('@/views/CreatorsView.vue'), meta: { title: '设计师管理', permission: 'creators' } },
        { path: 'checkout-options', name: 'checkout-options', component: () => import('@/views/CheckoutOptionsView.vue'), meta: { title: '结算选项', adminOnly: true } },
        { path: 'settings', name: 'settings', component: () => import('@/views/SettingsView.vue'), meta: { title: '系统设置', adminOnly: true } },
        { path: 'accounts', name: 'accounts', component: () => import('@/views/AccountsView.vue'), meta: { title: '账号与权限', adminOnly: true } },
        { path: 'roles', name: 'roles', component: () => import('@/views/RolesView.vue'), meta: { title: '角色管理', adminOnly: true } },
      ],
    },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

router.beforeEach(async (to) => {
  if (to.meta.public) return true
  const auth = useAuth()
  const valid = await auth.bootstrap()
  if (!valid) return { name: 'login', query: { redirect: to.fullPath } }
  const fallback = auth.firstAccessiblePage()
  if (to.meta.adminOnly && !auth.isSuperAdmin.value) return fallback ? { name: fallback } : false
  const permission = typeof to.meta.permission === 'string' ? to.meta.permission : ''
  if (permission && !auth.can(permission)) return fallback ? { name: fallback } : false
  return true
})

window.addEventListener('admin:unauthorized', () => {
  const auth = useAuth()
  auth.clear()
  if (router.currentRoute.value.name !== 'login') {
    void router.replace({ name: 'login', query: { redirect: router.currentRoute.value.fullPath } })
  }
})

export default router
