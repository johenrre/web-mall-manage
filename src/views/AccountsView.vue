<template>
  <div class="page-shell">
    <PageHeader title="账号与权限" description="管理可以登录后台的账号及其访问范围">
      <a-input-search
        v-model:value="keyword"
        allow-clear
        placeholder="搜索账号或名称"
        style="width: 240px"
        @search="search"
      />
      <a-button :loading="loading" @click="load"><ReloadOutlined /> 刷新</a-button>
      <a-button type="primary" @click="openCreate"><PlusOutlined /> 新增账号</a-button>
    </PageHeader>

    <a-alert
      class="role-tip"
      type="info"
      show-icon
      message="超级管理员可访问全部功能；其他账号按所选角色访问业务页面，不能进入商城配置和系统管理。"
    />

    <a-card class="surface-card" :bordered="false">
      <a-table
        row-key="id"
        :columns="columns"
        :data-source="accounts"
        :loading="loading"
        :pagination="pagination"
        :scroll="{ x: 960 }"
        @change="onTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'account'">
            <div class="account-cell">
              <a-avatar :src="resolveMedia(record.avatar)" class="account-avatar">
                {{ (record.nickname || record.username || '账').slice(0, 1) }}
              </a-avatar>
              <div>
                <div class="account-title">
                  <b>{{ record.nickname || record.username }}</b>
                  <a-tag v-if="record.is_builtin" color="gold">默认管理员</a-tag>
                  <a-tag v-if="record.id === auth.state.user?.id" color="green">当前账号</a-tag>
                </div>
                <div class="muted mono">@{{ record.username }}</div>
              </div>
            </div>
          </template>
          <template v-else-if="column.key === 'role'">
            <a-tag :color="record.role_is_super_admin || record.role === 'admin' ? 'purple' : 'blue'">
              {{ record.role_name || (record.role === 'admin' ? '超级管理员' : '默认业务角色') }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'status'">
            <a-badge
              :status="record.status === 'active' ? 'success' : 'default'"
              :text="record.status === 'active' ? '正常' : '已停用'"
            />
          </template>
          <template v-else-if="column.key === 'last_login_at'">
            {{ record.last_login_at ? dateTime(record.last_login_at) : '尚未登录' }}
          </template>
          <template v-else-if="column.key === 'created_at'">{{ dateTime(record.created_at) }}</template>
          <template v-else-if="column.key === 'action'">
            <a-space>
              <a-button type="link" size="small" @click="openEdit(record)">编辑</a-button>
              <a-button
                type="link"
                size="small"
                :disabled="record.id === auth.state.user?.id"
                @click="openReset(record)"
              >
                重置密码
              </a-button>
              <a-button
                type="link"
                size="small"
                danger
                :disabled="record.is_builtin || record.id === auth.state.user?.id"
                @click="remove(record)"
              >
                删除
              </a-button>
            </a-space>
          </template>
        </template>
        <template #emptyText><a-empty description="暂无后台账号" /></template>
      </a-table>
    </a-card>

    <a-modal
      v-model:open="createOpen"
      title="新增后台账号"
      ok-text="创建账号"
      :confirm-loading="saving"
      @ok="createAccount"
    >
      <a-form layout="vertical" :model="createForm" autocomplete="off">
        <a-form-item label="登录账号" required>
          <a-input v-model:value="createForm.username" maxlength="30" autocomplete="off" placeholder="3～30位字母、数字或 _ . -" />
        </a-form-item>
        <a-form-item label="账号名称" required>
          <a-input v-model:value="createForm.nickname" maxlength="40" autocomplete="off" placeholder="例如：客服小王" />
        </a-form-item>
        <a-form-item label="初始密码" required>
          <a-input-password v-model:value="createForm.password" maxlength="72" autocomplete="new-password" placeholder="至少6位" />
        </a-form-item>
        <a-form-item label="账号角色" required>
          <a-select v-model:value="createForm.role_id" placeholder="请选择角色">
            <a-select-option v-for="role in assignableRoles" :key="role.id" :value="role.id">
              {{ role.name }}
            </a-select-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>

    <a-modal
      v-model:open="editOpen"
      title="编辑后台账号"
      ok-text="保存修改"
      :confirm-loading="saving"
      @ok="saveAccount"
    >
      <a-form layout="vertical" :model="editForm">
        <a-form-item label="登录账号"><a-input :value="editForm.username" disabled /></a-form-item>
        <a-form-item label="账号名称" required>
          <a-input v-model:value="editForm.nickname" maxlength="40" />
        </a-form-item>
        <a-form-item label="账号角色" required>
          <a-select v-model:value="editForm.role_id" :disabled="editForm.locked" placeholder="请选择角色">
            <a-select-option v-for="role in editRoleOptions" :key="role.id" :value="role.id">
              {{ role.name }}{{ role.is_super_admin ? '（全部权限）' : '' }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="账号状态" required>
          <a-radio-group v-model:value="editForm.status" :disabled="editForm.locked">
            <a-radio value="active">正常</a-radio>
            <a-radio value="disabled">停用</a-radio>
          </a-radio-group>
        </a-form-item>
        <a-alert
          v-if="editForm.locked"
          type="warning"
          show-icon
          message="默认管理员或当前登录账号不能修改角色和状态。"
        />
      </a-form>
    </a-modal>

    <a-modal
      v-model:open="resetOpen"
      title="重置登录密码"
      ok-text="确认重置"
      :confirm-loading="saving"
      @ok="resetPassword"
    >
      <a-alert class="reset-tip" type="warning" show-icon :message="`正在重置“${resetForm.name}”的登录密码。`" />
      <a-form layout="vertical" autocomplete="off">
        <a-form-item label="新密码" required>
          <a-input-password v-model:value="resetForm.password" maxlength="72" autocomplete="new-password" placeholder="至少6位" />
        </a-form-item>
        <a-form-item label="确认新密码" required>
          <a-input-password v-model:value="resetForm.confirmPassword" maxlength="72" autocomplete="new-password" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { message, Modal } from 'ant-design-vue'
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons-vue'
import PageHeader from '@/components/PageHeader.vue'
import { errorMessage, get, post } from '@/api/http'
import { useAuth } from '@/stores/auth'
import { dateTime, listFrom, resolveMedia, totalFrom } from '@/utils/format'

type AccountStatus = 'active' | 'disabled'

interface AdminRole {
  id: number
  name: string
  permissions: string[]
  is_super_admin: boolean
  account_count: number
}

interface Account {
  id: number
  username: string
  nickname?: string
  avatar?: string
  role: 'admin' | 'user'
  role_id: number | null
  role_name?: string
  role_is_super_admin?: boolean
  status: AccountStatus
  is_builtin: boolean
  last_login_at?: string
  created_at: string
}

const auth = useAuth()
const columns = [
  { title: '后台账号', key: 'account', width: 270 },
  { title: '角色', key: 'role', width: 120 },
  { title: '状态', key: 'status', width: 110 },
  { title: '最后登录', key: 'last_login_at', width: 180 },
  { title: '创建时间', key: 'created_at', width: 180 },
  { title: '操作', key: 'action', width: 250, fixed: 'right' as const },
]
const accounts = ref<Account[]>([])
const roles = ref<AdminRole[]>([])
const loading = ref(false)
const saving = ref(false)
const keyword = ref('')
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const createOpen = ref(false)
const editOpen = ref(false)
const resetOpen = ref(false)
const createForm = reactive({ username: '', nickname: '', password: '', role_id: 0 })
const editForm = reactive({
  id: 0,
  username: '',
  nickname: '',
  role_id: 0,
  status: 'active' as AccountStatus,
  locked: false,
})
const resetForm = reactive({ id: 0, name: '', password: '', confirmPassword: '' })
const assignableRoles = computed(() => roles.value.filter((role) => !role.is_super_admin))
const editRoleOptions = computed(() => editForm.locked ? roles.value : assignableRoles.value)
const pagination = computed(() => ({
  current: page.value,
  pageSize: pageSize.value,
  total: total.value,
  showSizeChanger: true,
  showTotal: (value: number) => `共 ${value} 个后台账号`,
}))

async function load() {
  loading.value = true
  try {
    const data = await get('/api/admin/accounts', {
      page: page.value,
      pageSize: pageSize.value,
      keyword: keyword.value.trim(),
    })
    accounts.value = listFrom(data) as Account[]
    total.value = totalFrom(data, accounts.value.length)
  } catch (error) {
    message.error(errorMessage(error))
  } finally {
    loading.value = false
  }
}

async function loadRoles() {
  const data = await get('/api/admin/roles')
  roles.value = listFrom(data) as AdminRole[]
}

function search() {
  page.value = 1
  void load()
}

function onTableChange(value: { current?: number; pageSize?: number }) {
  page.value = value.current || 1
  pageSize.value = value.pageSize || 20
  void load()
}

function openCreate() {
  const defaultRole = assignableRoles.value[0]
  Object.assign(createForm, { username: '', nickname: '', password: '', role_id: defaultRole?.id || 0 })
  createOpen.value = true
}

async function createAccount() {
  if (!/^[A-Za-z0-9_.-]{3,30}$/.test(createForm.username.trim())) {
    return message.warning('登录账号格式不正确')
  }
  if (!createForm.nickname.trim()) return message.warning('请输入账号名称')
  if (createForm.password.length < 6) return message.warning('初始密码至少6位')
  if (!createForm.role_id) return message.warning('请选择账号角色')
  saving.value = true
  try {
    await post('/api/admin/accounts/create', {
      username: createForm.username.trim(),
      nickname: createForm.nickname.trim(),
      password: createForm.password,
      role_id: createForm.role_id,
    })
    message.success('后台账号已创建')
    createOpen.value = false
    page.value = 1
    await load()
  } catch (error) {
    message.error(errorMessage(error))
  } finally {
    saving.value = false
  }
}

function openEdit(account: Account) {
  Object.assign(editForm, {
    id: account.id,
    username: account.username,
    nickname: account.nickname || '',
    role_id: account.role_id,
    status: account.status,
    locked: account.is_builtin || account.id === auth.state.user?.id,
  })
  editOpen.value = true
}

async function saveAccount() {
  if (!editForm.nickname.trim()) return message.warning('请输入账号名称')
  if (!editForm.role_id) return message.warning('请选择账号角色')
  saving.value = true
  try {
    await post('/api/admin/accounts/update', {
      id: editForm.id,
      nickname: editForm.nickname.trim(),
      role_id: editForm.role_id,
      status: editForm.status,
    })
    message.success('后台账号已更新')
    editOpen.value = false
    await load()
  } catch (error) {
    message.error(errorMessage(error))
  } finally {
    saving.value = false
  }
}

function openReset(account: Account) {
  Object.assign(resetForm, {
    id: account.id,
    name: account.nickname || account.username,
    password: '',
    confirmPassword: '',
  })
  resetOpen.value = true
}

async function resetPassword() {
  if (resetForm.password.length < 6) return message.warning('新密码至少6位')
  if (resetForm.password !== resetForm.confirmPassword) return message.warning('两次输入的密码不一致')
  saving.value = true
  try {
    await post('/api/admin/accounts/reset_password', { id: resetForm.id, password: resetForm.password })
    message.success('登录密码已重置')
    resetOpen.value = false
  } catch (error) {
    message.error(errorMessage(error))
  } finally {
    saving.value = false
  }
}

function remove(account: Account) {
  Modal.confirm({
    title: `删除后台账号“${account.nickname || account.username}”？`,
    content: '删除后该账号会立即退出并且无法再次登录，历史操作记录会保留。',
    okText: '确认删除',
    okType: 'danger',
    cancelText: '取消',
    async onOk() {
      try {
        await post('/api/admin/accounts/delete', { id: account.id })
        message.success('后台账号已删除')
        await load()
      } catch (error) {
        message.error(errorMessage(error))
      }
    },
  })
}

onMounted(async () => {
  try {
    await loadRoles()
    await load()
  } catch (error) {
    message.error(errorMessage(error))
  }
})
</script>

<style scoped>
.role-tip { margin-bottom: 16px; }
.account-cell { display: flex; align-items: center; gap: 12px; }
.account-avatar { flex: 0 0 auto; color: #fff; background: linear-gradient(135deg, #327b65, #b99455); }
.account-title { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
.account-title :deep(.ant-tag) { margin-inline-end: 0; }
.reset-tip { margin-bottom: 20px; }
</style>
