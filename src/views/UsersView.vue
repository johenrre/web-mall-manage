<template>
  <div class="page-shell">
    <PageHeader title="用户管理" description="维护用户资料、账号角色与账户余额">
      <a-input-search v-model:value="keyword" allow-clear placeholder="搜索用户名或昵称" style="width:260px" @search="search" />
      <a-button :loading="loading" @click="load"><ReloadOutlined /> 刷新</a-button>
    </PageHeader>

    <a-card class="surface-card" :bordered="false">
      <a-table row-key="id" :columns="columns" :data-source="users" :loading="loading" :pagination="pagination" :scroll="{ x: 1050 }" @change="onTableChange">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'user'">
            <div class="table-user"><a-avatar :src="resolveMedia(record.avatar)">{{ (record.nickname || record.username || '用').slice(0,1) }}</a-avatar><div><b>{{ record.nickname || '未设置昵称' }}</b><div class="muted mono">@{{ record.username }}</div></div></div>
          </template>
          <template v-else-if="column.key === 'role'"><a-tag :color="record.role === 'admin' ? 'green' : 'default'" :bordered="false">{{ record.role === 'admin' ? '管理员' : '普通用户' }}</a-tag></template>
          <template v-else-if="column.key === 'balance'"><span class="money">{{ money(record.balance) }}</span></template>
          <template v-else-if="column.key === 'created_at'">{{ dateTime(record.created_at) }}</template>
          <template v-else-if="column.key === 'action'">
            <a-space><a-button type="link" size="small" @click="openEdit(record)">编辑</a-button><a-button type="link" size="small" @click="openRecharge(record)">充值</a-button><a-button type="link" size="small" danger @click="remove(record)">删除</a-button></a-space>
          </template>
        </template>
        <template #emptyText><a-empty description="没有匹配的用户" /></template>
      </a-table>
    </a-card>

    <a-modal v-model:open="editOpen" title="编辑用户" ok-text="保存修改" :confirm-loading="saving" @ok="saveUser">
      <a-form layout="vertical" :model="editForm">
        <a-form-item label="用户名"><a-input :value="editForm.username" disabled /></a-form-item>
        <a-form-item label="昵称" required><a-input v-model:value="editForm.nickname" maxlength="40" /></a-form-item>
        <a-form-item label="账号角色"><a-radio-group v-model:value="editForm.role"><a-radio-button value="user">普通用户</a-radio-button><a-radio-button value="admin">管理员</a-radio-button></a-radio-group></a-form-item>
      </a-form>
    </a-modal>

    <a-modal v-model:open="rechargeOpen" title="账户充值" ok-text="确认充值" :confirm-loading="saving" @ok="saveRecharge">
      <a-alert type="warning" show-icon class="modal-alert"><template #message>正在为 {{ selected?.nickname || selected?.username }} 充值，当前余额 {{ money(selected?.balance) }}</template></a-alert>
      <a-form layout="vertical" :model="rechargeForm">
        <a-form-item label="充值金额" required><a-input-number v-model:value="rechargeForm.amount" :min="0.01" :precision="2" prefix="¥" style="width:100%" /></a-form-item>
        <a-form-item label="充值原因"><a-input v-model:value="rechargeForm.reason" maxlength="100" /></a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { message, Modal } from 'ant-design-vue'
import { ReloadOutlined } from '@ant-design/icons-vue'
import PageHeader from '@/components/PageHeader.vue'
import { errorMessage, get, post } from '@/api/http'
import { dateTime, listFrom, money, resolveMedia, totalFrom } from '@/utils/format'

const columns = [
  { title:'用户', key:'user', width:220 }, { title:'ID', dataIndex:'id', width:80 }, { title:'角色', key:'role', width:110 },
  { title:'余额', key:'balance', width:120 }, { title:'订单数', dataIndex:'order_count', width:100 }, { title:'注册时间', key:'created_at', width:170 }, { title:'操作', key:'action', width:190, fixed:'right' as const },
]
const loading = ref(false), saving = ref(false), editOpen = ref(false), rechargeOpen = ref(false)
const users = ref<any[]>([]), selected = ref<any>(), keyword = ref(''), page = ref(1), pageSize = ref(20), total = ref(0)
const editForm = reactive({ id:0, username:'', nickname:'', role:'user' })
const rechargeForm = reactive({ amount: 100, reason: '管理员充值' })
const pagination = computed(() => ({ current: page.value, pageSize: pageSize.value, total: total.value, showSizeChanger: true, showTotal: (n:number) => `共 ${n} 位用户` }))

async function load() { loading.value=true; try { const data:any=await get('/api/user/list',{page:page.value,pageSize:pageSize.value,keyword:keyword.value.trim()}); users.value=listFrom(data); total.value=totalFrom(data,users.value.length) } catch(e){ message.error(errorMessage(e)) } finally{loading.value=false} }
function search(){ page.value=1; void load() }
function onTableChange(p:any){ page.value=p.current; pageSize.value=p.pageSize; void load() }
function openEdit(user:any){ selected.value=user; Object.assign(editForm,{id:user.id,username:user.username,nickname:user.nickname||'',role:user.role||'user'}); editOpen.value=true }
function openRecharge(user:any){ selected.value=user; rechargeForm.amount=100; rechargeForm.reason='管理员充值'; rechargeOpen.value=true }
async function saveUser(){ if(!editForm.nickname.trim()) return message.warning('请输入昵称'); saving.value=true; try{await post('/api/user/update',{id:editForm.id,nickname:editForm.nickname.trim(),role:editForm.role});message.success('用户资料已更新');editOpen.value=false;await load()}catch(e){message.error(errorMessage(e))}finally{saving.value=false} }
async function saveRecharge(){ if(!selected.value||rechargeForm.amount<.01)return message.warning('请输入正确的充值金额');saving.value=true;try{const result:any=await post('/api/user/recharge',{id:selected.value.id,amount:rechargeForm.amount,reason:rechargeForm.reason.trim()||'管理员充值'});message.success(`充值成功${result?.balance_after!==undefined?`，最新余额 ${money(result.balance_after)}`:''}`);rechargeOpen.value=false;await load()}catch(e){message.error(errorMessage(e))}finally{saving.value=false} }
function remove(user:any){Modal.confirm({title:`删除用户“${user.nickname||user.username}”？`,content:'该操作不可恢复，且可能影响关联业务数据。',okText:'确认删除',okType:'danger',cancelText:'取消',async onOk(){try{await post('/api/user/delete',{id:user.id});message.success('用户已删除');await load()}catch(e){message.error(errorMessage(e))}}})}
onMounted(load)
</script>

<style scoped>.modal-alert{margin-bottom:20px}</style>
