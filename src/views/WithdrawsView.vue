<template>
  <div class="page-shell">
    <PageHeader title="提现管理" description="审核用户提现申请，确保资金处理有据可查">
      <a-segmented v-model:value="filter" :options="filterOptions" />
      <a-button :loading="loading" @click="load"><ReloadOutlined /> 刷新</a-button>
    </PageHeader>
    <a-row :gutter="[16,16]">
      <a-col :xs="24" :md="8"><a-card class="mini-metric surface-card" :bordered="false"><span>待处理</span><b>{{ summary.pending }}</b><small>笔申请</small></a-card></a-col>
      <a-col :xs="24" :md="8"><a-card class="mini-metric surface-card" :bordered="false"><span>待处理金额</span><b class="money">{{ money(summary.amount) }}</b><small>需财务关注</small></a-card></a-col>
      <a-col :xs="24" :md="8"><a-card class="mini-metric surface-card" :bordered="false"><span>已处理</span><b>{{ summary.done }}</b><small>笔申请</small></a-card></a-col>
    </a-row>
    <a-card class="surface-card" :bordered="false">
      <a-table row-key="id" :columns="columns" :data-source="filtered" :loading="loading" :scroll="{x:1050}" :pagination="{pageSize:20,showSizeChanger:true}">
        <template #bodyCell="{column,record}">
          <template v-if="column.key==='user'"><div class="table-user"><a-avatar>{{ (record.user?.nickname||record.user?.username||'用').slice(0,1) }}</a-avatar><div><b>{{ record.user?.nickname||record.user?.username||`用户 ${record.user_id}` }}</b><div class="muted mono">ID {{ record.user_id }}</div></div></div></template>
          <template v-else-if="column.key==='amount'"><span class="money">{{ money(record.amount) }}</span></template>
          <template v-else-if="column.key==='account'"><b>{{ record.real_name||record.name||'—' }}</b><div class="muted mono">{{ record.alipay_account||record.account||'—' }}</div></template>
          <template v-else-if="column.key==='status'"><a-tag :color="statusMap[record.status]?.color||'default'" :bordered="false">{{ statusMap[record.status]?.text||record.status }}</a-tag><div v-if="record.admin_remark" class="remark">{{ record.admin_remark }}</div></template>
          <template v-else-if="column.key==='created_at'">{{ dateTime(record.created_at) }}</template>
          <template v-else-if="column.key==='action'"><a-space v-if="record.status==='pending'"><a-button type="primary" size="small" @click="openProcess(record,'paid')">标记打款</a-button><a-button danger size="small" @click="openProcess(record,'rejected')">拒绝</a-button></a-space><span v-else class="muted">已处理</span></template>
        </template>
      </a-table>
    </a-card>
    <a-modal v-model:open="processOpen" :title="action==='paid'?'确认已打款':'拒绝提现'" :ok-text="action==='paid'?'确认打款':'确认拒绝'" :ok-button-props="{danger:action==='rejected'}" :confirm-loading="saving" @ok="process">
      <a-descriptions :column="1" bordered size="small"><a-descriptions-item label="申请用户">{{ selected?.user?.nickname||selected?.user?.username }}</a-descriptions-item><a-descriptions-item label="提现金额"><span class="money">{{ money(selected?.amount) }}</span></a-descriptions-item><a-descriptions-item label="收款账户">{{ selected?.real_name||selected?.name }} · {{ selected?.alipay_account||selected?.account }}</a-descriptions-item></a-descriptions>
      <a-form-item class="remark-input" :label="action==='rejected'?'拒绝原因':'处理备注'" :required="action==='rejected'"><a-textarea v-model:value="remark" :rows="3" maxlength="200" show-count /></a-form-item>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed,onMounted,ref } from 'vue'
import { message } from 'ant-design-vue'
import { ReloadOutlined } from '@ant-design/icons-vue'
import PageHeader from '@/components/PageHeader.vue'
import { errorMessage,get,post } from '@/api/http'
import { dateTime,listFrom,money } from '@/utils/format'
const columns=[{title:'申请用户',key:'user',width:210},{title:'金额',key:'amount',width:120},{title:'支付宝收款信息',key:'account',width:220},{title:'状态/备注',key:'status',width:190},{title:'申请时间',key:'created_at',width:170},{title:'操作',key:'action',width:190,fixed:'right' as const}]
const statusMap:any={pending:{text:'待处理',color:'gold'},paid:{text:'已打款',color:'green'},rejected:{text:'已拒绝',color:'red'}}
const filterOptions=[{label:'全部',value:'all'},{label:'待处理',value:'pending'},{label:'已打款',value:'paid'},{label:'已拒绝',value:'rejected'}]
const loading=ref(false),saving=ref(false),list=ref<any[]>([]),filter=ref('all'),processOpen=ref(false),selected=ref<any>(),action=ref<'paid'|'rejected'>('paid'),remark=ref('')
const filtered=computed(()=>filter.value==='all'?list.value:list.value.filter(x=>x.status===filter.value))
const summary=computed(()=>({pending:list.value.filter(x=>x.status==='pending').length,amount:list.value.filter(x=>x.status==='pending').reduce((n,x)=>n+Number(x.amount||0),0),done:list.value.filter(x=>x.status!=='pending').length}))
async function load(){loading.value=true;try{list.value=listFrom(await get('/api/admin/withdraw_list'))}catch(e){message.error(errorMessage(e))}finally{loading.value=false}}
function openProcess(row:any,next:'paid'|'rejected'){selected.value=row;action.value=next;remark.value='';processOpen.value=true}
async function process(){if(action.value==='rejected'&&!remark.value.trim())return message.warning('请填写拒绝原因');saving.value=true;try{await post('/api/admin/withdraw_process',{id:selected.value.id,status:action.value,remark:remark.value.trim()});message.success('提现申请已处理');processOpen.value=false;await load()}catch(e){message.error(errorMessage(e))}finally{saving.value=false}}
onMounted(load)
</script>

<style scoped>.mini-metric :deep(.ant-card-body){display:flex;align-items:baseline;gap:8px}.mini-metric span{flex:1;color:#77857f}.mini-metric b{color:#24463c;font:700 26px Georgia,serif}.mini-metric small,.remark{color:#9aa6a1;font-size:11px}.remark{margin-top:5px}.remark-input{margin-top:20px}</style>
