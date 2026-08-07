<template>
  <div class="page-shell overview-page">
    <PageHeader title="经营概览" :description="welcomeText">
      <a-button :loading="loading" @click="load"><ReloadOutlined /> 刷新数据</a-button>
      <a-button type="primary" @click="go('/orders')">查看订单 <ArrowRightOutlined /></a-button>
    </PageHeader>

    <section class="metric-grid" aria-label="核心经营指标">
      <article v-for="card in cards" :key="card.key" class="metric-card surface-card">
        <div class="metric-card__top">
          <span class="metric-icon" :style="{ color: card.color, background: card.background }">
            <component :is="card.icon" />
          </span>
          <div class="metric-trend">
            <span>近 7 日趋势</span>
            <svg class="sparkline" viewBox="0 0 150 58" preserveAspectRatio="none" aria-hidden="true">
              <polyline
                :points="sparklinePoints(card.trend)"
                fill="none"
                :stroke="card.color"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="3"
              />
            </svg>
          </div>
        </div>
        <span class="metric-label">{{ card.title }}</span>
        <strong class="metric-value">{{ card.value }}</strong>
        <div class="metric-yesterday">
          <span>昨日</span>
          <strong>{{ card.yesterdayValue }}</strong>
        </div>
        <div class="metric-change" :class="card.change.tone">
          <ArrowUpOutlined v-if="card.change.tone === 'up'" />
          <ArrowDownOutlined v-else-if="card.change.tone === 'down'" />
          <MinusOutlined v-else />
          {{ card.change.text }}
        </div>
      </article>
    </section>

    <section class="workbench-grid">
      <article class="performance-card">
        <div class="performance-glow"></div>
        <div class="performance-head">
          <div class="performance-title">
            <span class="performance-icon"><LineChartOutlined /></span>
            <div><small>本月业绩</small><strong>{{ money(stats.monthly.sales) }}</strong></div>
          </div>
          <span class="performance-change" :class="changeOf(stats.monthly.sales_change).tone">
            <ArrowUpOutlined v-if="changeOf(stats.monthly.sales_change).tone === 'up'" />
            <ArrowDownOutlined v-else-if="changeOf(stats.monthly.sales_change).tone === 'down'" />
            <MinusOutlined v-else />
            {{ changeOf(stats.monthly.sales_change).shortText }}
          </span>
        </div>
        <p>汇总本月已支付、已发货和已完成订单，数据来自真实交易记录。</p>
        <div class="performance-metrics">
          <div><small>本月订单</small><strong>{{ stats.monthly.orders }}</strong></div>
          <div><small>支付订单</small><strong>{{ stats.monthly.paid_orders }}</strong></div>
          <div><small>新增用户</small><strong>{{ stats.monthly.new_users }}</strong></div>
        </div>
        <button type="button" class="performance-action" @click="go('/orders')">
          查看订单详情 <ArrowRightOutlined />
        </button>
      </article>

      <article class="dashboard-panel quick-panel surface-card">
        <header class="panel-head">
          <div><small>常用功能</small><h2>快捷入口</h2></div>
          <AppstoreOutlined />
        </header>
        <div class="quick-grid">
          <button
            v-for="action in quickActions"
            :key="action.path"
            type="button"
            class="quick-action"
            :class="{ primary: action.primary }"
            @click="go(action.path)"
          >
            <span><component :is="action.icon" /></span>
            <b>{{ action.label }}</b>
            <small>{{ action.description }}</small>
          </button>
        </div>
      </article>

      <article class="dashboard-panel pending-panel surface-card">
        <header class="panel-head">
          <div><small>需要关注</small><h2>待处理事项</h2></div>
          <span class="panel-total">{{ pendingTotal }}</span>
        </header>
        <div class="pending-list">
          <button
            v-for="item in pendingItems"
            :key="item.label"
            type="button"
            class="pending-row"
            @click="go(item.path)"
          >
            <span class="pending-icon" :class="item.tone"><component :is="item.icon" /></span>
            <span class="pending-copy"><b>{{ item.label }}</b><small>{{ item.description }}</small></span>
            <strong :class="item.tone">{{ item.count }}</strong>
            <RightOutlined />
          </button>
        </div>
      </article>
    </section>

    <section class="insight-grid">
      <article class="dashboard-panel recent-panel surface-card">
        <header class="panel-head">
          <div><small>交易动态</small><h2>最近订单</h2></div>
          <button type="button" class="text-action" @click="go('/orders')">全部订单 <ArrowRightOutlined /></button>
        </header>
        <a-skeleton v-if="loading" active :paragraph="{ rows: 5 }" />
        <a-empty v-else-if="!stats.recent_orders.length" description="暂无订单数据" />
        <div v-else class="recent-list">
          <button
            v-for="order in stats.recent_orders"
            :key="order.id"
            type="button"
            class="recent-order"
            @click="go('/orders')"
          >
            <span class="order-mark"><ShoppingOutlined /></span>
            <span class="order-main">
              <b>{{ order.order_no }}</b>
              <small>{{ order.display_name }} · {{ order.design_name || '定制设计' }}</small>
            </span>
            <span class="order-time">{{ dateTime(order.created_at) }}</span>
            <span class="order-amount">{{ money(order.total_price) }}</span>
            <span class="order-status" :class="order.status">{{ statusText(order.status) }}</span>
          </button>
        </div>
      </article>

      <article class="dashboard-panel status-panel surface-card">
        <header class="panel-head">
          <div><small>全部订单</small><h2>订单状态</h2></div>
          <span class="panel-total">{{ stats.order_count }}</span>
        </header>
        <a-skeleton v-if="loading" active :paragraph="{ rows: 6 }" />
        <div v-else class="status-list">
          <div v-for="item in statusRows" :key="item.key" class="status-row">
            <div class="status-label"><span :style="{ background: item.color }"></span>{{ item.label }}</div>
            <div class="status-track"><i :style="{ width: `${item.percent}%`, background: item.color }"></i></div>
            <strong>{{ item.count }}</strong>
          </div>
        </div>
      </article>

      <article class="dashboard-panel hot-panel surface-card">
        <header class="panel-head">
          <div><small>已支付订单</small><h2>热门盘珠</h2></div>
          <FireOutlined class="hot-icon" />
        </header>
        <a-skeleton v-if="loading" active :paragraph="{ rows: 6 }" />
        <a-empty v-else-if="!stats.hot_beads.length" description="暂无已支付订单数据" />
        <div v-else class="hot-list">
          <div v-for="(bead, index) in stats.hot_beads.slice(0, 6)" :key="bead.id" class="hot-row">
            <span class="rank" :class="{ top: index < 3 }">{{ index + 1 }}</span>
            <a-avatar shape="square" :size="40" :src="resolveMedia(bead.image)">{{ bead.name?.slice(0, 1) }}</a-avatar>
            <span class="hot-name"><b>{{ bead.name }}</b><small>珠材 ID · {{ bead.id }}</small></span>
            <strong>{{ bead.count }} 次</strong>
          </div>
        </div>
      </article>
    </section>

    <footer class="data-foot">
      <span class="health-dot"></span>
      数据来自当前业务数据库
      <template v-if="stats.generated_at"> · 更新于 {{ dateTime(stats.generated_at) }}</template>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { message } from 'ant-design-vue'
import { useRouter } from 'vue-router'
import {
  AppstoreOutlined,
  ArrowDownOutlined,
  ArrowRightOutlined,
  ArrowUpOutlined,
  AuditOutlined,
  CustomerServiceOutlined,
  FireOutlined,
  FundOutlined,
  LineChartOutlined,
  MinusOutlined,
  PictureOutlined,
  ReloadOutlined,
  RiseOutlined,
  SettingOutlined,
  ShoppingCartOutlined,
  ShoppingOutlined,
  SkinOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons-vue'
import PageHeader from '@/components/PageHeader.vue'
import { errorMessage, get } from '@/api/http'
import { useAuth } from '@/stores/auth'
import { dateTime, money, orderStatus, resolveMedia } from '@/utils/format'

interface MonthlyStats {
  sales: number
  previous_sales: number
  sales_change: number | null
  orders: number
  previous_orders: number
  orders_change: number | null
  paid_orders: number
  previous_paid_orders: number
  new_users: number
  previous_new_users: number
  users_change: number | null
  conversion_rate: number
  previous_conversion_rate: number
  conversion_change: number
}

interface DailyTrend {
  date: string
  sales: number
  orders: number
  paid_orders: number
  users: number
  conversion_rate: number
}

interface YesterdayStats {
  sales: number
  orders: number
  paid_orders: number
  new_users: number
  conversion_rate: number
}

interface DashboardStats {
  total_sales: number
  user_count: number
  order_count: number
  paid_order_count: number
  conversion_rate: number
  design_count: number
  status_counts: Record<string, number>
  hot_beads: Array<{ id: string; name: string; image: string; count: number }>
  monthly: MonthlyStats
  yesterday: YesterdayStats
  pending: {
    paid_pending_ship: number
    refund_review: number
    design_review: number
  }
  daily_trend: DailyTrend[]
  recent_orders: Array<{
    id: number
    order_no: string
    total_price: number
    status: string
    created_at: string
    display_name: string
    design_name?: string
  }>
  generated_at: string
}

const emptyMonthly: MonthlyStats = {
  sales: 0,
  previous_sales: 0,
  sales_change: null,
  orders: 0,
  previous_orders: 0,
  orders_change: null,
  paid_orders: 0,
  previous_paid_orders: 0,
  new_users: 0,
  previous_new_users: 0,
  users_change: null,
  conversion_rate: 0,
  previous_conversion_rate: 0,
  conversion_change: 0,
}

const emptyStats: DashboardStats = {
  total_sales: 0,
  user_count: 0,
  order_count: 0,
  paid_order_count: 0,
  conversion_rate: 0,
  design_count: 0,
  status_counts: {},
  hot_beads: [],
  monthly: emptyMonthly,
  yesterday: {
    sales: 0,
    orders: 0,
    paid_orders: 0,
    new_users: 0,
    conversion_rate: 0,
  },
  pending: {
    paid_pending_ship: 0,
    refund_review: 0,
    design_review: 0,
  },
  daily_trend: [],
  recent_orders: [],
  generated_at: '',
}

const router = useRouter()
const auth = useAuth()
const loading = ref(false)
const stats = ref<DashboardStats>(structuredClone(emptyStats))

const welcomeText = computed(() => {
  const name = auth.state.user?.nickname || auth.state.user?.username || '管理员'
  const date = new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  }).format(new Date())
  return `欢迎，${name}！今天是 ${date}`
})

type ChangeTone = 'up' | 'down' | 'neutral'

function changeOf(value: number | null, unit = '%') {
  if (value === null || !Number.isFinite(Number(value))) {
    return { tone: 'neutral' as ChangeTone, text: '暂无上月同期对比', shortText: '暂无对比' }
  }
  const number = Number(value)
  const tone: ChangeTone = number > 0 ? 'up' : number < 0 ? 'down' : 'neutral'
  const numberText = `${Math.abs(number).toFixed(1)}${unit}`
  return {
    tone,
    text: number === 0 ? '与上月同期持平' : `${numberText} 较上月同期`,
    shortText: number === 0 ? '持平' : numberText,
  }
}

const cards = computed(() => [
  {
    key: 'users',
    title: '本月新增用户',
    value: `${stats.value.monthly.new_users.toLocaleString()} 人`,
    yesterdayValue: `${stats.value.yesterday.new_users.toLocaleString()} 人`,
    color: '#4477c8',
    background: '#eaf2ff',
    icon: UserOutlined,
    change: changeOf(stats.value.monthly.users_change),
    trend: stats.value.daily_trend.map((item) => item.users),
  },
  {
    key: 'sales',
    title: '本月销售额',
    value: money(stats.value.monthly.sales),
    yesterdayValue: money(stats.value.yesterday.sales),
    color: '#319b7a',
    background: '#e7f7f1',
    icon: FundOutlined,
    change: changeOf(stats.value.monthly.sales_change),
    trend: stats.value.daily_trend.map((item) => item.sales),
  },
  {
    key: 'orders',
    title: '本月订单总数',
    value: `${stats.value.monthly.orders.toLocaleString()} 笔`,
    yesterdayValue: `${stats.value.yesterday.orders.toLocaleString()} 笔`,
    color: '#d1833f',
    background: '#fff1e5',
    icon: ShoppingCartOutlined,
    change: changeOf(stats.value.monthly.orders_change),
    trend: stats.value.daily_trend.map((item) => item.orders),
  },
  {
    key: 'conversion',
    title: '本月支付转化率',
    value: `${Number(stats.value.monthly.conversion_rate).toFixed(1)}%`,
    yesterdayValue: `${Number(stats.value.yesterday.conversion_rate).toFixed(1)}%`,
    color: '#9565c7',
    background: '#f2ebfb',
    icon: RiseOutlined,
    change: changeOf(stats.value.monthly.conversion_change, ' 个百分点'),
    trend: stats.value.daily_trend.map((item) => item.conversion_rate),
  },
])

const quickActions = computed(() => [
  { label: '订单管理', description: '处理订单与发货', path: '/orders', icon: ShoppingCartOutlined, primary: true },
  { label: '盘珠管理', description: '维护珠材资料', path: '/beads', icon: SkinOutlined, primary: false },
  { label: '设计审核', description: '查看投稿作品', path: '/designs', icon: PictureOutlined, primary: false },
  ...(auth.isSuperAdmin.value
    ? [{ label: '系统设置', description: '配置小程序展示', path: '/settings', icon: SettingOutlined, primary: false }]
    : []),
])

const pendingItems = computed(() => [
  {
    label: '待发货订单',
    description: '已支付，等待填写物流',
    count: stats.value.pending.paid_pending_ship,
    path: '/orders',
    icon: ShoppingOutlined,
    tone: 'amber',
  },
  {
    label: '待处理售后',
    description: '等待审核的售后申请',
    count: stats.value.pending.refund_review,
    path: '/aftersales',
    icon: CustomerServiceOutlined,
    tone: 'red',
  },
  {
    label: '待审核作品',
    description: '等待审核的投稿设计',
    count: stats.value.pending.design_review,
    path: '/designs',
    icon: AuditOutlined,
    tone: 'blue',
  },
])

const pendingTotal = computed(() => pendingItems.value.reduce((total, item) => total + item.count, 0))

const statusRows = computed(() => Object.entries(orderStatus).map(([key, item]) => {
  const count = Number(stats.value.status_counts?.[key] || 0)
  const colors: Record<string, string> = {
    pending: '#d89b43',
    paid: '#c18229',
    shipped: '#4f7fb0',
    completed: '#3f8b6c',
    cancelled: '#9aa6a1',
    refund: '#c55b54',
  }
  return {
    key,
    label: item.text,
    count,
    color: colors[key] || '#8a9993',
    percent: stats.value.order_count ? Math.round((count / stats.value.order_count) * 100) : 0,
  }
}))

function sparklinePoints(values: number[]): string {
  const source = values.length > 1 ? values : [0, ...(values.length ? values : [0])]
  const minimum = Math.min(...source)
  const maximum = Math.max(...source)
  const range = Math.max(1, maximum - minimum)
  return source.map((value, index) => {
    const x = source.length === 1 ? 75 : (index / (source.length - 1)) * 146 + 2
    const y = 52 - ((value - minimum) / range) * 42
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
}

function statusText(status: string): string {
  return orderStatus[status]?.text || status || '未知状态'
}

function go(path: string) {
  void router.push(path)
}

async function load() {
  loading.value = true
  try {
    stats.value = await get<DashboardStats>('/api/admin/stats')
  } catch (error) {
    message.error(errorMessage(error))
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.overview-page{--dash-ink:#1f332d;--dash-muted:#85918d;--dash-line:#e8eeeb}
.metric-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px}.metric-card{position:relative;min-height:232px;overflow:hidden;padding:22px;border-radius:18px;background:#fff}.metric-card__top{display:flex;align-items:flex-start;justify-content:space-between;height:60px}.metric-icon{display:grid;place-items:center;flex:0 0 42px;height:42px;border-radius:13px;font-size:20px}.metric-trend{display:flex;width:46%;min-width:88px;flex-direction:column;align-items:flex-end;gap:1px}.metric-trend>span{color:#a2aca8;font-size:10px;line-height:1}.sparkline{width:100%;height:44px;opacity:.48}.metric-label{display:block;margin-top:8px;color:#74827d;font-size:13px}.metric-value{display:block;margin-top:7px;color:#172923;font:750 29px/1.08 Georgia,'Noto Serif SC',serif;letter-spacing:-.02em}.metric-yesterday{display:flex;align-items:center;justify-content:space-between;margin-top:13px;padding-top:10px;border-top:1px solid #eef1ef;color:#8d9994;font-size:11px}.metric-yesterday strong{color:#53645e;font-size:12px;font-weight:700}.metric-change{display:flex;align-items:center;gap:5px;margin-top:9px;font-size:11px;font-weight:650}.metric-change.up{color:#339879}.metric-change.down{color:#cf665d}.metric-change.neutral{color:#9aa5a0}
.workbench-grid{display:grid;grid-template-columns:minmax(340px,1.08fr) minmax(330px,.94fr) minmax(320px,.98fr);gap:16px}.dashboard-panel{padding:22px;border-radius:18px;background:#fff}.panel-head{display:flex;align-items:center;justify-content:space-between;gap:15px;margin-bottom:18px}.panel-head small{color:#9aa49f;font-size:10px;letter-spacing:.08em}.panel-head h2{margin:3px 0 0;color:var(--dash-ink);font-size:18px}.panel-head>svg{color:#81908a;font-size:18px}.panel-total{display:grid;place-items:center;min-width:32px;height:28px;padding:0 9px;border-radius:10px;color:#5c6d66;background:#f1f5f3;font-size:12px;font-weight:700}
.performance-card{position:relative;overflow:hidden;min-height:330px;padding:24px;border-radius:20px;color:#fff;background:linear-gradient(145deg,#173a31,#102a24);box-shadow:0 18px 40px rgba(18,54,45,.18)}.performance-card:before{position:absolute;inset:0;content:'';opacity:.16;background-image:radial-gradient(rgba(255,255,255,.65) .7px,transparent .7px);background-size:16px 16px}.performance-glow{position:absolute;right:-70px;top:-70px;width:220px;height:220px;border-radius:50%;background:radial-gradient(circle,rgba(214,190,127,.25),transparent 65%)}.performance-card>*:not(.performance-glow){position:relative}.performance-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px}.performance-title{display:flex;align-items:center;gap:13px}.performance-icon{display:grid;place-items:center;width:48px;height:48px;border-radius:14px;color:#eadbb1;background:rgba(255,255,255,.1);font-size:23px}.performance-title div{display:flex;flex-direction:column}.performance-title small{color:rgba(255,255,255,.55);font-size:11px}.performance-title strong{margin-top:4px;color:#fff;font:750 30px Georgia,'Noto Serif SC',serif}.performance-change{display:flex;align-items:center;gap:5px;padding:8px 10px;border-radius:10px;font-size:12px;font-weight:700}.performance-change.up{color:#aee4cf;background:rgba(52,151,115,.2)}.performance-change.down{color:#ffd0cb;background:rgba(198,87,80,.2)}.performance-change.neutral{color:#d6ddd9;background:rgba(255,255,255,.08)}.performance-card>p{max-width:420px;margin:20px 0;color:rgba(255,255,255,.56);font-size:12px;line-height:1.8}.performance-metrics{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.performance-metrics>div{display:flex;flex-direction:column;align-items:center;padding:14px 8px;border:1px solid rgba(255,255,255,.08);border-radius:13px;background:rgba(255,255,255,.055)}.performance-metrics small{color:rgba(255,255,255,.48);font-size:10px}.performance-metrics strong{margin-top:5px;color:#fff;font-size:19px}.performance-action{display:flex;align-items:center;justify-content:center;gap:9px;width:100%;margin-top:14px;padding:11px;border:1px solid rgba(255,255,255,.09);border-radius:11px;color:#eef5f2;background:rgba(255,255,255,.09);cursor:pointer}.performance-action:hover{background:rgba(255,255,255,.14)}
.quick-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:11px}.quick-action{display:flex;min-height:112px;align-items:center;flex-direction:column;justify-content:center;padding:12px;border:1px solid #edf1ef;border-radius:15px;color:#55665f;background:#f7f9f8;cursor:pointer;transition:.18s ease}.quick-action:hover{border-color:#cfded8;box-shadow:0 8px 20px rgba(30,78,65,.07);transform:translateY(-1px)}.quick-action>span{display:grid;place-items:center;width:35px;height:35px;border-radius:11px;color:#667770;background:#fff;font-size:17px;box-shadow:0 4px 12px rgba(28,63,54,.06)}.quick-action b{margin-top:9px;font-size:12px}.quick-action small{margin-top:3px;color:#9aa49f;font-size:9px}.quick-action.primary{border-color:#183c33;color:#fff;background:#173930}.quick-action.primary>span{color:#e8d7aa;background:rgba(255,255,255,.1);box-shadow:none}.quick-action.primary small{color:rgba(255,255,255,.5)}
.pending-list{display:flex;flex-direction:column}.pending-row{display:grid;grid-template-columns:38px minmax(0,1fr) auto 14px;align-items:center;gap:11px;width:100%;padding:11px 2px;border:0;border-bottom:1px solid #eef2f0;color:#4d6058;background:transparent;cursor:pointer;text-align:left}.pending-row:last-child{border-bottom:0}.pending-row:hover .pending-copy b{color:#1f6854}.pending-row>svg{color:#b0b8b4;font-size:10px}.pending-icon{display:grid;place-items:center;width:35px;height:35px;border-radius:11px;font-size:16px}.pending-icon.amber{color:#b87720;background:#fff2df}.pending-icon.red{color:#bc5d55;background:#fff0ee}.pending-icon.blue{color:#4c78aa;background:#ebf3fd}.pending-icon.violet{color:#8d61b4;background:#f3edfa}.pending-copy{display:flex;min-width:0;flex-direction:column}.pending-copy b{font-size:12px;transition:.15s}.pending-copy small{overflow:hidden;margin-top:3px;color:#9aa49f;font-size:9px;text-overflow:ellipsis;white-space:nowrap}.pending-row>strong{font-size:15px}.pending-row>strong.amber{color:#bc7b21}.pending-row>strong.red{color:#c25e56}.pending-row>strong.blue{color:#4d7caf}.pending-row>strong.violet{color:#8b5eb2}
.insight-grid{display:grid;grid-template-columns:minmax(440px,1.28fr) minmax(300px,.86fr) minmax(300px,.86fr);gap:16px}.text-action{display:flex;align-items:center;gap:6px;padding:0;border:0;color:#28705b;background:transparent;cursor:pointer;font-size:11px}.recent-list{display:flex;flex-direction:column}.recent-order{display:grid;grid-template-columns:38px minmax(160px,1fr) 118px 92px 72px;align-items:center;gap:11px;width:100%;padding:10px 0;border:0;border-bottom:1px solid #eef2f0;color:#4f625b;background:transparent;cursor:pointer;text-align:left}.recent-order:last-child{border-bottom:0}.recent-order:hover .order-main b{color:#1f6854}.order-mark{display:grid;place-items:center;width:35px;height:35px;border-radius:11px;color:#2d7963;background:#eaf4ef}.order-main{display:flex;min-width:0;flex-direction:column}.order-main b{overflow:hidden;color:#31463f;font-size:11px;text-overflow:ellipsis;white-space:nowrap}.order-main small{overflow:hidden;margin-top:3px;color:#98a39f;font-size:9px;text-overflow:ellipsis;white-space:nowrap}.order-time{color:#919e99;font-size:9px}.order-amount{color:#9b6b2c;font:700 13px Georgia,serif;text-align:right}.order-status{padding:5px 7px;border-radius:8px;color:#65766f;background:#f0f3f2;font-size:9px;text-align:center}.order-status.paid{color:#9b6827;background:#fff2df}.order-status.shipped{color:#4777a6;background:#ecf3fb}.order-status.completed{color:#32765e;background:#e9f4ef}.order-status.refund{color:#b75b54;background:#fff0ee}
.status-list{display:flex;flex-direction:column;gap:17px;padding-top:4px}.status-row{display:grid;grid-template-columns:74px 1fr 30px;align-items:center;gap:10px}.status-label{display:flex;align-items:center;gap:8px;color:#63736d;font-size:11px}.status-label>span{width:7px;height:7px;border-radius:50%}.status-track{height:6px;overflow:hidden;border-radius:99px;background:#edf1ef}.status-track i{display:block;height:100%;min-width:0;border-radius:inherit}.status-row>strong{text-align:right;font-size:11px}.hot-icon{color:#c98a3a!important}.hot-list{display:flex;flex-direction:column}.hot-row{display:flex;align-items:center;gap:9px;padding:7px 0;border-bottom:1px solid #eef2f0}.hot-row:last-child{border-bottom:0}.rank{display:grid;place-items:center;flex:0 0 21px;height:21px;border-radius:7px;color:#89958f;background:#f0f3f2;font-size:9px}.rank.top{color:#8e652c;background:#f5e9cd}.hot-name{display:flex;min-width:0;flex:1;flex-direction:column}.hot-name b{overflow:hidden;color:#43564f;font-size:11px;text-overflow:ellipsis;white-space:nowrap}.hot-name small{margin-top:2px;color:#a0aaa6;font-size:8px}.hot-row>strong{color:#9b6c2f;font-size:10px}.data-foot{display:flex;align-items:center;justify-content:flex-end;color:#98a39f;font-size:10px}.health-dot{width:7px;height:7px;margin-right:7px;border-radius:50%;background:#39a57d;box-shadow:0 0 0 4px rgba(57,165,125,.1)}
@media(max-width:1500px){.workbench-grid{grid-template-columns:1.1fr .9fr}.pending-panel{grid-column:1/-1}.pending-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0 18px}.insight-grid{grid-template-columns:1fr 1fr}.recent-panel{grid-column:1/-1}}
@media(max-width:1160px){.metric-grid{grid-template-columns:repeat(2,1fr)}.workbench-grid{grid-template-columns:1fr}.pending-panel{grid-column:auto}.insight-grid{grid-template-columns:1fr}.recent-panel{grid-column:auto}}
@media(max-width:720px){.metric-grid{grid-template-columns:1fr}.metric-card{min-height:190px}.pending-list{grid-template-columns:1fr}.quick-grid{grid-template-columns:1fr 1fr}.recent-order{grid-template-columns:36px minmax(0,1fr) 78px}.order-time,.order-status{display:none}.performance-head{align-items:flex-start;flex-direction:column}.performance-metrics{grid-template-columns:1fr 1fr 1fr}.dashboard-panel,.performance-card{padding:18px}}
@media(max-width:420px){.quick-grid{grid-template-columns:1fr}.performance-metrics{grid-template-columns:1fr}.recent-order{grid-template-columns:36px minmax(0,1fr)}.order-amount{display:none}}
</style>
