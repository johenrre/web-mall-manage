<template>
  <div class="page-shell">
    <PageHeader title="现金卡券" description="创建现金抵扣权益，提升用户回访与转化">
      <a-button :loading="loading" @click="load"><ReloadOutlined /> 刷新</a-button>
      <a-button type="primary" @click="createOpen=true"><PlusOutlined /> 创建卡券</a-button>
    </PageHeader>
    <a-alert type="info" show-icon message="当前后端仅支持创建和查看卡券，编辑、停用、有效期和领取明细待后续接口补齐。" />
    <a-card class="surface-card" :bordered="false">
      <a-table row-key="id" :columns="columns" :data-source="coupons" :loading="loading" :pagination="{pageSize:20}">
        <template #bodyCell="{column,record}">
          <template v-if="column.key==='title'"><div class="coupon-title"><span class="coupon-icon"><GiftOutlined /></span><div><b>{{ record.title }}</b><small>现金抵扣券</small></div></div></template>
          <template v-else-if="column.key==='amount'"><span class="coupon-money">{{ money(record.amount) }}</span></template>
          <template v-else-if="column.key==='quantity'">{{ record.claimed_quantity||0 }} / {{ Number(record.total_quantity)===0?'不限量':record.total_quantity }}</template>
          <template v-else-if="column.key==='status'"><a-badge :status="record.status==='active'?'success':'default'" :text="record.status==='active'?'发放中':'已停用'" /></template>
          <template v-else-if="column.key==='created_at'">{{ dateTime(record.created_at) }}</template>
        </template>
        <template #emptyText><a-empty description="还没有创建现金卡券" /></template>
      </a-table>
    </a-card>
    <a-modal v-model:open="createOpen" title="创建现金卡券" ok-text="立即创建" :confirm-loading="saving" @ok="createCoupon">
      <a-form layout="vertical" :model="form">
        <a-form-item label="卡券名称" required><a-input v-model:value="form.title" maxlength="40" placeholder="例如：新客专享 20 元券" /></a-form-item>
        <div class="form-grid"><a-form-item label="卡券金额" required><a-input-number v-model:value="form.amount" :min="0.01" :precision="2" prefix="¥" style="width:100%" /></a-form-item><a-form-item label="发行数量"><a-input-number v-model:value="form.quantity" :min="0" :precision="0" style="width:100%" /><div class="muted quantity-tip">0 表示不限量</div></a-form-item></div>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { onMounted,reactive,ref } from 'vue'
import { message } from 'ant-design-vue'
import { GiftOutlined,PlusOutlined,ReloadOutlined } from '@ant-design/icons-vue'
import PageHeader from '@/components/PageHeader.vue'
import { errorMessage,get,post } from '@/api/http'
import { dateTime,listFrom,money } from '@/utils/format'
const columns=[{title:'卡券',key:'title'},{title:'面额',key:'amount',width:130},{title:'已领取 / 总量',key:'quantity',width:160},{title:'状态',key:'status',width:120},{title:'创建时间',key:'created_at',width:180}]
const loading=ref(false),saving=ref(false),createOpen=ref(false),coupons=ref<any[]>([])
const form=reactive({title:'',amount:20,quantity:0})
async function load(){loading.value=true;try{coupons.value=listFrom(await get('/api/admin/coupon_list'))}catch(e){message.error(errorMessage(e))}finally{loading.value=false}}
async function createCoupon(){if(!form.title.trim()||form.amount<=0)return message.warning('请填写卡券名称和正确金额');saving.value=true;try{await post('/api/admin/coupon_create',{...form,title:form.title.trim()});message.success('现金卡券创建成功');createOpen.value=false;Object.assign(form,{title:'',amount:20,quantity:0});await load()}catch(e){message.error(errorMessage(e))}finally{saving.value=false}}
onMounted(load)
</script>

<style scoped>.coupon-title{display:flex;align-items:center;gap:12px}.coupon-title>span{display:grid;place-items:center;width:42px;height:42px;border-radius:12px;color:#9a6a26;background:#f8efd9;font-size:18px}.coupon-title>div{display:flex;flex-direction:column}.coupon-title small,.quantity-tip{font-size:11px}.coupon-money{color:#b27524;font:700 20px Georgia,serif}</style>
