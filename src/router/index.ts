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
        { path: 'stats', name: 'stats', component: () => import('@/views/StatsView.vue'), meta: { title: '经营概览' } },
        { path: 'orders', name: 'orders', component: () => import('@/views/OrdersView.vue'), meta: { title: '订单管理' } },
        { path: 'aftersales', name: 'aftersales', component: () => import('@/views/OrdersView.vue'), props: { aftersales: true }, meta: { title: '售后管理' } },
        { path: 'beads', name: 'beads', component: () => import('@/views/BeadsView.vue'), meta: { title: '盘珠管理' } },
        { path: 'products', name: 'products', component: () => import('@/views/ProductsView.vue'), meta: { title: '商品管理' } },
        { path: 'coupons', name: 'coupons', component: () => import('@/views/CouponsView.vue'), meta: { title: '现金卡券' } },
        { path: 'users', name: 'users', component: () => import('@/views/UsersView.vue'), meta: { title: '用户管理' } },
        { path: 'designs', name: 'designs', component: () => import('@/views/DesignsView.vue'), meta: { title: '设计管理' } },
        { path: 'creators', name: 'creators', component: () => import('@/views/CreatorsView.vue'), meta: { title: '设计师管理' } },
        { path: 'checkout-options', name: 'checkout-options', component: () => import('@/views/CheckoutOptionsView.vue'), meta: { title: '结算选项', adminOnly: true } },
        { path: 'settings', name: 'settings', component: () => import('@/views/SettingsView.vue'), meta: { title: '系统设置', adminOnly: true } },
        { path: 'accounts', name: 'accounts', component: () => import('@/views/AccountsView.vue'), meta: { title: '账号与权限', adminOnly: true } },
      ],
    },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

router.beforeEach(async (to) => {
  document.title = `${String(to.meta.title || '管理后台')} · 璞光`
  if (to.meta.public) return true
  const auth = useAuth()
  const valid = await auth.bootstrap()
  if (!valid) return { name: 'login', query: { redirect: to.fullPath } }
  if (to.meta.adminOnly && !auth.isSuperAdmin.value) return { name: 'stats' }
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
