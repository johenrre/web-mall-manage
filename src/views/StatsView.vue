<template>
  <div class="page-shell">
    <PageHeader title="经营概览" description="掌握商城交易、转化与热门珠材的实时表现">
      <a-button :loading="loading" @click="load"><ReloadOutlined /> 刷新数据</a-button>
      <a-button type="primary" @click="$router.push('/orders')">查看订单 <ArrowRightOutlined /></a-button>
    </PageHeader>

    <a-row :gutter="[16,16]">
      <a-col v-for="card in cards" :key="card.title" :xs="24" :sm="12" :xl="6">
        <a-card class="metric-card surface-card" :bordered="false">
          <div class="metric-top"><div class="metric-icon" :style="{ color: card.color, background: card.bg }"><component :is="card.icon" /></div><span>{{ card.note }}</span></div>
          <div class="metric-value">{{ card.value }}</div>
          <div class="metric-title">{{ card.title }}</div>
        </a-card>
      </a-col>
    </a-row>

    <a-row :gutter="[16,16]">
      <a-col :xs="24" :xl="14">
        <a-card title="订单状态分布" class="surface-card fill-card" :bordered="false">
          <template #extra><span class="muted">共 {{ stats.order_count }} 笔</span></template>
          <a-skeleton v-if="loading" active :paragraph="{ rows: 6 }" />
          <div v-else class="status-list">
            <div v-for="item in statusRows" :key="item.key" class="status-row">
              <div class="status-name"><span class="status-dot" :style="{ background: item.color }"></span>{{ item.label }}</div>
              <a-progress :percent="item.percent" :stroke-color="item.color" :show-info="false" />
              <strong>{{ item.count }}</strong>
            </div>
          </div>
        </a-card>
      </a-col>
      <a-col :xs="24" :xl="10">
        <a-card title="热门盘珠 TOP 10" class="surface-card fill-card" :bordered="false">
          <template #extra><FireOutlined class="hot-icon" /></template>
          <a-skeleton v-if="loading" active :paragraph="{ rows: 6 }" />
          <a-empty v-else-if="!stats.hot_beads.length" description="暂无已支付订单数据" />
          <div v-else class="hot-list">
            <div v-for="(bead,index) in stats.hot_beads" :key="bead.id" class="hot-row">
              <span class="rank" :class="{ top: Number(index) < 3 }">{{ Number(index) + 1 }}</span>
              <a-avatar shape="square" :size="42" :src="resolveMedia(bead.image)">{{ bead.name?.slice(0,1) }}</a-avatar>
              <div class="hot-name"><b>{{ bead.name }}</b><small>珠材 ID · {{ bead.id }}</small></div>
              <span class="use-count">{{ bead.count }} 次</span>
            </div>
          </div>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { message } from 'ant-design-vue'
import { ArrowRightOutlined, CheckCircleOutlined, FireOutlined, FundOutlined, ReloadOutlined, ShoppingOutlined, ThunderboltOutlined } from '@ant-design/icons-vue'
import PageHeader from '@/components/PageHeader.vue'
import { errorMessage, get } from '@/api/http'
import { money, orderStatus, resolveMedia } from '@/utils/format'

const loading = ref(false)
const stats = reactive<any>({ total_sales: 0, order_count: 0, paid_order_count: 0, conversion_rate: 0, design_count: 0, status_counts: {}, hot_beads: [] })

const cards = computed(() => [
  { title: '累计销售额', value: money(stats.total_sales), note: '已支付口径', color: '#ad772c', bg: '#fbf4e5', icon: FundOutlined },
  { title: '订单总数', value: stats.order_count.toLocaleString(), note: '全部订单', color: '#326f5e', bg: '#eaf4ef', icon: ShoppingOutlined },
  { title: '已支付订单', value: stats.paid_order_count.toLocaleString(), note: '含已发货/完成', color: '#397b69', bg: '#eaf4ef', icon: CheckCircleOutlined },
  { title: '支付转化率', value: `${Number(stats.conversion_rate).toFixed(1)}%`, note: `${stats.design_count} 个设计`, color: '#8c5ba0', bg: '#f5edf8', icon: ThunderboltOutlined },
])

const statusRows = computed(() => Object.entries(orderStatus).map(([key, item]) => {
  const count = Number(stats.status_counts?.[key] || 0)
  const colorMap: Record<string,string> = { pending:'#d89b43',paid:'#c18229',shipped:'#4f7fb0',completed:'#3f8b6c',cancelled:'#9aa6a1',refund:'#c55b54' }
  return { key, label: item.text, count, color: colorMap[key], percent: stats.order_count ? Math.round(count / stats.order_count * 100) : 0 }
}))

async function load() {
  loading.value = true
  try { Object.assign(stats, await get('/api/admin/stats')) }
  catch (error) { message.error(errorMessage(error)) }
  finally { loading.value = false }
}

onMounted(load)
</script>

<style scoped>
.metric-card{min-height:156px;background:linear-gradient(145deg,#fff,#fbfcfb)}.metric-top{display:flex;align-items:center;justify-content:space-between;color:#9aa6a1;font-size:11px}.metric-icon{display:grid;place-items:center;width:40px;height:40px;border-radius:12px;font-size:20px}.metric-value{margin-top:18px;color:#203c34;font:700 28px/1.1 Georgia,'Noto Serif SC',serif}.metric-title{margin-top:7px;color:#77857f;font-size:13px}.fill-card{height:100%;min-height:430px}.status-list{display:flex;flex-direction:column;gap:22px;padding:8px 4px}.status-row{display:grid;grid-template-columns:90px 1fr 42px;align-items:center;gap:14px}.status-name{display:flex;align-items:center;gap:9px;color:#576963;font-size:13px}.status-dot{width:8px;height:8px;border-radius:50%}.status-row strong{text-align:right}.hot-icon{color:#c98938}.hot-list{display:flex;flex-direction:column;gap:4px}.hot-row{display:flex;align-items:center;gap:11px;padding:9px 4px;border-bottom:1px solid #edf1ef}.rank{display:grid;place-items:center;width:22px;height:22px;border-radius:7px;color:#8e9a95;background:#f0f3f2;font-size:11px}.rank.top{color:#8d652b;background:#f4e8cb}.hot-name{display:flex;flex:1;flex-direction:column;min-width:0}.hot-name b{overflow:hidden;font-size:13px;text-overflow:ellipsis;white-space:nowrap}.hot-name small{color:#9aa6a1;font-size:10px}.use-count{color:#966b2e;font-size:12px;font-weight:700}
</style>
