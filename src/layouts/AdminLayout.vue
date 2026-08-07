<template>
  <a-layout class="admin-layout">
    <a-layout-sider v-model:collapsed="collapsed" :trigger="null" collapsible class="side" :width="248" :collapsed-width="76">
      <div class="brand" :class="{ compact: collapsed }">
        <BrandLogo class="brand-seal" :src="branding.state.logoUrl" :name="branding.state.appName" />
        <div v-if="!collapsed" class="brand-copy">
          <div class="brand-name" :title="branding.state.appName">{{ branding.state.appName }}</div>
          <div class="brand-sub">小程序管理后台</div>
        </div>
      </div>
      <a-menu theme="dark" mode="inline" :selected-keys="selectedKeys" :items="menuItems" @click="onMenuClick" />
      <div class="side-foot" :class="{ compact: collapsed }">
        <CloudServerOutlined />
        <span v-if="!collapsed"><b>服务已连接</b><small>API · 3000</small></span>
      </div>
    </a-layout-sider>
    <button
      v-if="isMobile && !collapsed"
      type="button"
      class="side-mask"
      aria-label="关闭导航菜单"
      @click="collapsed = true"
    />

    <a-layout class="content-layout">
      <a-layout-header class="topbar">
        <div class="topbar-left">
          <a-button type="text" class="collapse-btn" @click="collapsed = !collapsed">
            <MenuUnfoldOutlined v-if="collapsed" /><MenuFoldOutlined v-else />
          </a-button>
          <div class="route-label"><span>工作台</span><RightOutlined /><strong>{{ route.meta.title }}</strong></div>
        </div>
        <div class="topbar-actions">
          <a-tooltip title="刷新当前页面"><a-button type="text" shape="circle" @click="reloadPage"><ReloadOutlined /></a-button></a-tooltip>
          <a-dropdown placement="bottomRight">
            <button class="user-button">
              <a-avatar :size="36" :src="auth.state.user?.avatar" class="user-avatar">{{ initials }}</a-avatar>
              <span class="user-meta"><b>{{ auth.state.user?.nickname || auth.state.user?.username }}</b><small>{{ roleLabel }}</small></span>
              <DownOutlined />
            </button>
            <template #overlay>
              <a-menu>
                <a-menu-item key="password" @click="passwordOpen = true"><KeyOutlined /> 修改密码</a-menu-item>
                <a-menu-divider />
                <a-menu-item key="logout" danger @click="confirmLogout"><LogoutOutlined /> 退出登录</a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
        </div>
      </a-layout-header>

      <a-layout-content class="main-content">
        <router-view :key="viewKey" />
      </a-layout-content>
    </a-layout>
  </a-layout>

  <ChangePasswordModal :open="passwordOpen" @close="passwordOpen = false" @changed="afterPasswordChanged" />
</template>

<script setup lang="ts">
import { computed, h, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Modal } from 'ant-design-vue'
import {
  AppstoreOutlined, BarChartOutlined, BgColorsOutlined, CloudServerOutlined,
  DownOutlined, KeyOutlined, LogoutOutlined, MenuFoldOutlined, MenuUnfoldOutlined,
  PictureOutlined, ReloadOutlined, RightOutlined, SettingOutlined, ShopOutlined, ShoppingCartOutlined,
  SafetyCertificateOutlined, SkinOutlined, SolutionOutlined, TeamOutlined, UserSwitchOutlined,
} from '@ant-design/icons-vue'
import ChangePasswordModal from '@/components/ChangePasswordModal.vue'
import BrandLogo from '@/components/BrandLogo.vue'
import { get } from '@/api/http'
import { useAuth } from '@/stores/auth'
import { useBranding } from '@/stores/branding'

const route = useRoute()
const router = useRouter()
const auth = useAuth()
const branding = useBranding()
const isMobile = ref(window.innerWidth <= 768)
const collapsed = ref(window.innerWidth < 1100)
const passwordOpen = ref(false)
const refreshId = ref(0)
const notifications = ref({ paidPendingShipCount: 0 })
let timer: number | undefined

const initials = computed(() => (auth.state.user?.nickname || auth.state.user?.username || '管').slice(0, 1).toUpperCase())
const roleLabel = computed(() => auth.state.user?.role_name || (auth.isSuperAdmin.value ? '超级管理员' : '业务账号'))
const selectedKeys = computed(() => [String(route.name || 'stats')])
const viewKey = computed(() => `${route.fullPath}:${refreshId.value}`)

function labelWithBadge(label: string, count: number) {
  return h('div', { class: 'menu-label' }, [h('span', label), count > 0 ? h('span', { class: 'menu-count' }, count > 99 ? '99+' : count) : null])
}

const menuItems = computed(() => {
  const items: any[] = []
  if (auth.can('stats')) {
    items.push({ key: 'stats', icon: () => h(BarChartOutlined), label: '经营概览' })
  }

  const tradeItems = [
    auth.can('orders')
      ? { key: 'orders', icon: () => h(ShoppingCartOutlined), label: labelWithBadge('订单管理', notifications.value.paidPendingShipCount) }
      : null,
    auth.can('aftersales') ? { key: 'aftersales', icon: () => h(SolutionOutlined), label: '售后管理' } : null,
    auth.can('users') ? { key: 'users', icon: () => h(TeamOutlined), label: '用户管理' } : null,
  ].filter(Boolean)
  if (tradeItems.length) {
    items.push({ type: 'group', label: collapsed.value ? '' : '交易与用户', children: tradeItems })
  }

  const contentItems = [
    auth.can('products') ? { key: 'products', icon: () => h(ShopOutlined), label: '商品管理' } : null,
    auth.can('beads') ? { key: 'beads', icon: () => h(AppstoreOutlined), label: '盘珠管理' } : null,
    auth.can('designs') ? { key: 'designs', icon: () => h(PictureOutlined), label: '设计管理' } : null,
    auth.can('creators') ? { key: 'creators', icon: () => h(BgColorsOutlined), label: '设计师管理' } : null,
  ].filter(Boolean)
  if (contentItems.length) {
    items.push({ type: 'group', label: collapsed.value ? '' : '商品与内容', children: contentItems })
  }

  if (auth.isSuperAdmin.value) {
    items.push({
      type: 'group',
      label: collapsed.value ? '' : '商城配置',
      children: [
        { key: 'checkout-options', icon: () => h(SkinOutlined), label: '结算选项' },
        { key: 'settings', icon: () => h(SettingOutlined), label: '系统设置' },
      ],
    })
    items.push({
      type: 'group',
      label: collapsed.value ? '' : '系统管理',
      children: [
        { key: 'accounts', icon: () => h(UserSwitchOutlined), label: '账号与权限' },
        { key: 'roles', icon: () => h(SafetyCertificateOutlined), label: '角色管理' },
      ],
    })
  }
  return items
})

function onMenuClick({ key }: { key: string }) {
  void router.push({ name: key })
  if (isMobile.value) collapsed.value = true
}
function reloadPage() { refreshId.value += 1 }

function handleResize() {
  const nextMobile = window.innerWidth <= 768
  if (nextMobile === isMobile.value) return
  isMobile.value = nextMobile
  collapsed.value = nextMobile || window.innerWidth < 1100
}

async function loadNotifications() {
  if (!auth.can('orders') && !auth.can('aftersales')) return
  try { notifications.value = await get('/api/admin/notifications_summary') } catch { /* 登录态拦截器负责处理 */ }
}

function confirmLogout() {
  Modal.confirm({
    title: '确认退出登录？',
    content: '退出后需要重新输入管理员账号和密码。',
    okText: '退出',
    cancelText: '取消',
    async onOk() { await auth.logout(); await router.replace('/login') },
  })
}

async function afterPasswordChanged() {
  passwordOpen.value = false
  await auth.logout()
  await router.replace('/login')
}

onMounted(() => {
  void loadNotifications()
  timer = window.setInterval(loadNotifications, 20_000)
  window.addEventListener('resize', handleResize)
})
onBeforeUnmount(() => {
  if (timer) window.clearInterval(timer)
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.admin-layout{min-height:100vh}.side{position:fixed!important;inset:0 auto 0 0;z-index:20;overflow:auto;background:linear-gradient(180deg,#153f35 0%,#102e28 100%)!important;box-shadow:8px 0 34px rgba(16,52,43,.12)}
.side~.content-layout{min-width:0;margin-left:248px;transition:margin-left .2s}.side.ant-layout-sider-collapsed~.content-layout{margin-left:76px}.side-mask{position:fixed;inset:0;z-index:19;padding:0;border:0;background:rgba(8,31,25,.38);cursor:pointer}.brand{height:88px;display:flex;align-items:center;gap:13px;padding:0 22px;color:white}.brand.compact{justify-content:center;padding:0}.brand-seal{flex:0 0 42px;width:42px;height:42px;border:1px solid rgba(232,216,174,.75);border-radius:50%;color:#e8d8ae;font:22px Georgia,serif}.brand-seal :deep(img){object-fit:contain;padding:3px;background:#fff}.brand-copy{min-width:0}.brand-name{max-width:148px;overflow:hidden;font:700 17px Georgia,'Noto Serif SC',serif;text-overflow:ellipsis;white-space:nowrap}.brand-sub{margin-top:3px;color:rgba(255,255,255,.45);font-size:8px;letter-spacing:.12em}.side-foot{position:absolute;bottom:20px;left:16px;right:16px;display:flex;align-items:center;gap:10px;padding:12px;color:rgba(255,255,255,.68);border:1px solid rgba(255,255,255,.1);border-radius:12px;background:rgba(255,255,255,.04)}.side-foot.compact{justify-content:center}.side-foot span{display:flex;flex-direction:column}.side-foot b{font-size:12px}.side-foot small{margin-top:2px;color:rgba(255,255,255,.35);font-size:9px}.topbar{position:sticky;top:0;z-index:15;display:flex;align-items:center;justify-content:space-between;height:68px;padding:0 26px;border-bottom:1px solid rgba(31,104,84,.08);background:rgba(255,255,255,.88);backdrop-filter:blur(16px);line-height:normal}.topbar-left,.topbar-actions{display:flex;align-items:center;gap:12px}.collapse-btn{font-size:18px}.route-label{display:flex;align-items:center;gap:8px;color:#9ba6a1;font-size:13px}.route-label strong{color:#40544d}.user-button{display:flex;align-items:center;gap:10px;padding:6px 8px;border:0;border-radius:12px;color:#42564f;background:transparent;cursor:pointer;line-height:1.2}.user-button:hover{background:#f0f5f2}.user-avatar{color:#fff;background:linear-gradient(135deg,#327b65,#b99455)}.user-meta{display:flex;flex-direction:column;align-items:flex-start;min-width:82px;line-height:1.2}.user-meta b{max-width:120px;overflow:hidden;font-size:13px;line-height:18px;text-overflow:ellipsis;white-space:nowrap}.user-meta small{margin-top:2px;color:#9aa6a1;font-size:10px;line-height:14px}.main-content{min-width:0;min-height:calc(100vh - 68px);padding:26px}.menu-label{display:flex;align-items:center;justify-content:space-between;gap:8px}.menu-count{min-width:22px;height:18px;padding:0 6px;border-radius:9px;color:#fff;background:#c58b45;font-size:10px;line-height:18px;text-align:center}
:deep(.ant-menu-dark){background:transparent}:deep(.ant-menu-item-group-title){padding:18px 24px 8px!important;color:rgba(255,255,255,.32)!important;font-size:10px;letter-spacing:.12em}:deep(.ant-menu-item){margin-inline:12px!important;width:calc(100% - 24px)!important}:deep(.ant-menu-item-selected){box-shadow:inset 3px 0 #d7bb7b}
@media(max-width:768px){.side{position:fixed!important;transition:transform .2s}.side.ant-layout-sider-collapsed{transform:translateX(-100%)}.side:not(.ant-layout-sider-collapsed){width:248px!important;min-width:248px!important;transform:translateX(0)}.side~.content-layout,.side.ant-layout-sider-collapsed~.content-layout{margin-left:0}.topbar{padding:0 12px}.route-label span,.route-label :deep(svg),.user-meta{display:none}.main-content{padding:18px 12px}}
</style>
