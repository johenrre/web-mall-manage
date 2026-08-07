<template>
  <div class="page-shell">
    <PageHeader title="角色管理" description="按角色控制普通后台账号可访问的业务页面">
      <a-button :loading="loading" @click="load"><ReloadOutlined /> 刷新</a-button>
      <a-button type="primary" @click="openCreate"><PlusOutlined /> 新增角色</a-button>
    </PageHeader>

    <a-alert
      class="role-tip"
      type="info"
      show-icon
      message="超级管理员是系统固定角色，可访问商城配置和系统管理；其他角色只能配置下方业务页面。"
    />

    <a-card class="surface-card" :bordered="false">
      <a-table
        row-key="id"
        :columns="columns"
        :data-source="roles"
        :loading="loading"
        :pagination="false"
        :scroll="{ x: 920 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'name'">
            <div class="role-name">
              <b>{{ record.name }}</b>
              <a-tag v-if="record.is_super_admin" color="purple">系统固定</a-tag>
            </div>
          </template>
          <template v-else-if="column.key === 'permissions'">
            <div class="permission-tags">
              <a-tag v-if="record.is_super_admin" color="gold">全部业务页面</a-tag>
              <a-tag v-for="key in record.is_super_admin ? [] : record.permissions" :key="key">
                {{ pageLabel(key) }}
              </a-tag>
            </div>
          </template>
          <template v-else-if="column.key === 'account_count'">
            {{ record.account_count }} 个账号
          </template>
          <template v-else-if="column.key === 'updated_at'">
            {{ dateTime(record.updated_at) }}
          </template>
          <template v-else-if="column.key === 'action'">
            <span v-if="record.is_super_admin" class="muted">不可修改或删除</span>
            <a-space v-else>
              <a-button type="link" size="small" @click="openEdit(record)">编辑</a-button>
              <a-tooltip :title="record.account_count ? '请先调整关联账号的角色' : ''">
                <a-button
                  type="link"
                  size="small"
                  danger
                  :disabled="record.account_count > 0"
                  @click="remove(record)"
                >删除</a-button>
              </a-tooltip>
            </a-space>
          </template>
        </template>
        <template #emptyText><a-empty description="暂无角色" /></template>
      </a-table>
    </a-card>

    <a-modal
      v-model:open="editorOpen"
      :title="editingId ? '编辑角色' : '新增角色'"
      :ok-text="editingId ? '保存修改' : '创建角色'"
      :confirm-loading="saving"
      width="620px"
      @ok="save"
    >
      <a-form layout="vertical">
        <a-form-item label="角色名称" required>
          <a-input v-model:value="form.name" maxlength="30" placeholder="例如：客服、订单运营、内容编辑" />
        </a-form-item>
        <a-form-item label="可访问页面" required>
          <a-checkbox-group v-model:value="form.permissions" class="permission-groups">
            <section v-for="group in permissionGroups" :key="group.name" class="permission-group">
              <div class="permission-group__title">{{ group.name }}</div>
              <div class="permission-group__options">
                <a-checkbox v-for="page in group.pages" :key="page.key" :value="page.key">
                  {{ page.label }}
                </a-checkbox>
              </div>
            </section>
          </a-checkbox-group>
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
import { BUSINESS_PAGE_PERMISSIONS } from '@/config/admin-pages'
import { dateTime, listFrom } from '@/utils/format'

interface AdminRole {
  id: number
  name: string
  permissions: string[]
  is_super_admin: boolean
  account_count: number
  created_at: string
  updated_at: string
}

const columns = [
  { title: '角色', key: 'name', width: 190 },
  { title: '可访问页面', key: 'permissions', width: 420 },
  { title: '关联账号', key: 'account_count', width: 120 },
  { title: '更新时间', key: 'updated_at', width: 180 },
  { title: '操作', key: 'action', width: 170, fixed: 'right' as const },
]
const roles = ref<AdminRole[]>([])
const loading = ref(false)
const saving = ref(false)
const editorOpen = ref(false)
const editingId = ref(0)
const form = reactive({ name: '', permissions: [] as string[] })
const pageMap = new Map(BUSINESS_PAGE_PERMISSIONS.map((page) => [page.key, page.label]))
const permissionGroups = computed(() => ['经营与用户', '商品与内容'].map((name) => ({
  name,
  pages: BUSINESS_PAGE_PERMISSIONS.filter((page) => page.group === name),
})))

function pageLabel(key: string) {
  return pageMap.get(key) || key
}

async function load() {
  loading.value = true
  try {
    roles.value = listFrom(await get('/api/admin/roles')) as AdminRole[]
  } catch (error) {
    message.error(errorMessage(error))
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editingId.value = 0
  Object.assign(form, { name: '', permissions: [] })
  editorOpen.value = true
}

function openEdit(role: AdminRole) {
  editingId.value = role.id
  Object.assign(form, { name: role.name, permissions: [...role.permissions] })
  editorOpen.value = true
}

async function save() {
  const name = form.name.trim()
  if (!name) return message.warning('请输入角色名称')
  if (!form.permissions.length) return message.warning('请至少选择一个可访问页面')
  saving.value = true
  try {
    await post(
      editingId.value ? '/api/admin/roles/update' : '/api/admin/roles/create',
      { id: editingId.value || undefined, name, permissions: form.permissions },
    )
    message.success(editingId.value ? '角色已更新' : '角色已创建')
    editorOpen.value = false
    await load()
  } catch (error) {
    message.error(errorMessage(error))
  } finally {
    saving.value = false
  }
}

function remove(role: AdminRole) {
  Modal.confirm({
    title: `删除角色“${role.name}”？`,
    content: '删除后无法恢复。只有未关联账号的角色可以删除。',
    okText: '确认删除',
    okType: 'danger',
    cancelText: '取消',
    async onOk() {
      try {
        await post('/api/admin/roles/delete', { id: role.id })
        message.success('角色已删除')
        await load()
      } catch (error) {
        message.error(errorMessage(error))
      }
    },
  })
}

onMounted(load)
</script>

<style scoped>
.role-tip { margin-bottom: 16px; }
.role-name { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.permission-tags { display: flex; flex-wrap: wrap; gap: 6px; }
.permission-tags :deep(.ant-tag) { margin-inline-end: 0; }
.permission-groups { display: block; width: 100%; }
.permission-group { padding: 14px 16px; border: 1px solid #edf1ef; border-radius: 10px; background: #fafcfb; }
.permission-group + .permission-group { margin-top: 12px; }
.permission-group__title { margin-bottom: 12px; color: #41564f; font-weight: 600; }
.permission-group__options { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px 20px; }
@media (max-width: 600px) { .permission-group__options { grid-template-columns: 1fr; } }
</style>
