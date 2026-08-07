<template>
  <div class="page-shell">
    <PageHeader title="用户管理" description="查看和维护小程序用户资料">
      <a-input-search v-model:value="keyword" allow-clear placeholder="搜索用户名、昵称或手机号" style="width:280px" @search="search" />
      <a-button :loading="loading" @click="load"><ReloadOutlined /> 刷新</a-button>
    </PageHeader>

    <a-card class="surface-card" :bordered="false">
      <a-table row-key="id" :columns="columns" :data-source="users" :loading="loading" :pagination="pagination" :scroll="{ x: 760 }" @change="onTableChange">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'user'">
            <div class="table-user"><a-avatar :src="resolveMedia(record.avatar)">{{ (record.nickname || record.username || '用').slice(0,1) }}</a-avatar><div><b>{{ record.nickname || '未设置昵称' }}</b><div class="muted mono">@{{ record.username }}</div></div></div>
          </template>
          <template v-else-if="column.key === 'phone'">
            <span v-if="record.phone" class="mono">{{ record.phone }}</span>
            <span v-else class="muted">未授权</span>
          </template>
          <template v-else-if="column.key === 'created_at'">{{ dateTime(record.created_at) }}</template>
          <template v-else-if="column.key === 'action'">
            <a-space><a-button type="link" size="small" @click="openEdit(record)">编辑</a-button><a-button type="link" size="small" danger @click="remove(record)">删除</a-button></a-space>
          </template>
        </template>
        <template #emptyText><a-empty description="没有匹配的用户" /></template>
      </a-table>
    </a-card>

    <a-modal v-model:open="editOpen" title="编辑用户" ok-text="保存修改" :confirm-loading="saving" @ok="saveUser">
      <a-form layout="vertical" :model="editForm">
        <a-form-item label="用户名"><a-input :value="editForm.username" disabled /></a-form-item>
        <a-form-item label="昵称" required><a-input v-model:value="editForm.nickname" maxlength="40" /></a-form-item>
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
import { dateTime, listFrom, resolveMedia, totalFrom } from '@/utils/format'

const columns = [
  { title:'用户', key:'user', width:260 }, { title:'ID', dataIndex:'id', width:90 },
  { title:'手机号', key:'phone', width:150 }, { title:'订单数', dataIndex:'order_count', width:110 },
  { title:'注册时间', key:'created_at', width:180 }, { title:'操作', key:'action', width:140, fixed:'right' as const },
]
const loading = ref(false), saving = ref(false), editOpen = ref(false)
const users = ref<any[]>([]), keyword = ref(''), page = ref(1), pageSize = ref(20), total = ref(0)
const editForm = reactive({ id:0, username:'', nickname:'' })
const pagination = computed(() => ({ current: page.value, pageSize: pageSize.value, total: total.value, showSizeChanger: true, showTotal: (n:number) => `共 ${n} 位用户` }))

async function load() { loading.value=true; try { const data:any=await get('/api/user/list',{page:page.value,pageSize:pageSize.value,keyword:keyword.value.trim()}); users.value=listFrom(data); total.value=totalFrom(data,users.value.length) } catch(e){ message.error(errorMessage(e)) } finally{loading.value=false} }
function search(){ page.value=1; void load() }
function onTableChange(p:any){ page.value=p.current; pageSize.value=p.pageSize; void load() }
function openEdit(user:any){ Object.assign(editForm,{id:user.id,username:user.username,nickname:user.nickname||''}); editOpen.value=true }
async function saveUser(){ if(!editForm.nickname.trim()) return message.warning('请输入昵称'); saving.value=true; try{await post('/api/user/update',{id:editForm.id,nickname:editForm.nickname.trim()});message.success('用户资料已更新');editOpen.value=false;await load()}catch(e){message.error(errorMessage(e))}finally{saving.value=false} }
function remove(user:any){Modal.confirm({title:`删除用户“${user.nickname||user.username}”？`,content:'该操作不可恢复，且可能影响关联业务数据。',okText:'确认删除',okType:'danger',cancelText:'取消',async onOk(){try{await post('/api/user/delete',{id:user.id});message.success('用户已删除');await load()}catch(e){message.error(errorMessage(e))}}})}
onMounted(load)
</script>
