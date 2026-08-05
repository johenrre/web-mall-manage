<template>
  <div class="page-shell">
    <PageHeader title="结算选项" description="配置小程序结算页的制作、包装、绳色、配送和贺卡">
      <a-button @click="resetDefaults"><UndoOutlined /> 恢复默认</a-button>
      <a-button type="primary" :loading="saving" @click="save"><SaveOutlined /> 保存并发布</a-button>
    </PageHeader>

    <a-alert
      type="info"
      show-icon
      message="小程序会按商品金额智能选择：有免费项时默认选原价最高的一项，没有免费项时默认选价格最低的一项。满额免费填 0 表示不启用。"
    />

    <a-skeleton v-if="loading" active :paragraph="{ rows: 10 }" />
    <a-collapse v-else v-model:active-key="expanded" class="option-collapse" :bordered="false">
      <a-collapse-panel
        v-for="(group, groupIndex) in groups"
        :key="group.uid"
        class="group-panel"
        :class="{ 'group-panel--disabled': !group.enabled }"
      >
        <template #header>
          <div class="group-header">
            <span class="group-index">{{ groupIndex + 1 }}</span>
            <div class="group-header__copy">
              <b>{{ group.title || '未命名分组' }}</b>
              <small>{{ group.groupCode }} · {{ group.enabled ? `${group.options.filter(option => option.enabled).length}/${group.options.length} 个选项启用` : '整个分组已关闭' }}</small>
            </div>
            <a-tag :color="group.enabled ? 'green' : 'default'">{{ group.enabled ? '小程序显示' : '小程序隐藏' }}</a-tag>
          </div>
        </template>

        <div class="group-config form-grid">
          <a-form-item label="分组标题"><a-input v-model:value="group.title" /></a-form-item>
          <a-form-item label="固定编码"><a-input v-model:value="group.groupCode" disabled /></a-form-item>
          <a-form-item label="分组状态">
            <a-switch
              v-model:checked="group.enabled"
              checked-children="启用"
              un-checked-children="关闭"
              @click.stop
            />
          </a-form-item>
        </div>

        <div class="option-list">
          <article
            v-for="(option, optionIndex) in group.options"
            :key="option.uid"
            class="option-card"
            :class="{
              disabled: !group.enabled || !option.enabled,
            }"
          >
            <div class="option-editor">
              <div class="option-fields">
                <label><small>选项名称</small><a-input v-model:value="option.title" placeholder="例如：礼盒包装" /></label>
                <label><small>选项编码</small><a-input v-model:value="option.optionCode" placeholder="例如：gift" /></label>
                <label class="option-fields__wide"><small>选项说明</small><a-input v-model:value="option.subtitle" placeholder="显示在选项名称下方" /></label>
                <label><small>价格</small><a-input-number v-model:value="option.amount" :min="0" :precision="2" prefix="¥" :disabled="option.isFree" style="width: 100%" /></label>
                <label><small>满额免费</small><a-input-number v-model:value="option.freeThreshold" :min="0" :precision="2" prefix="¥" :disabled="option.isFree" style="width: 100%" /></label>
              </div>

              <div class="option-image-upload">
                <div class="option-image-preview">
                  <img v-if="option.image" :src="resolveMedia(option.image)" alt="选项图片" />
                  <PictureOutlined v-else />
                </div>
                <div class="option-image-actions">
                  <strong>选项图片</strong>
                  <small>可选；上传后显示在小程序选项左侧</small>
                  <div>
                    <a-upload
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      :show-upload-list="false"
                      :custom-request="uploadRequestFor(option)"
                    >
                      <a-button size="small" :loading="uploadingOptionUid === option.uid">
                        <UploadOutlined /> {{ option.image ? '更换图片' : '上传图片' }}
                      </a-button>
                    </a-upload>
                    <a-button v-if="option.image" size="small" type="text" danger @click="option.image = ''">
                      <CloseOutlined /> 移除
                    </a-button>
                  </div>
                </div>
              </div>

              <div class="option-switches">
                <a-checkbox v-model:checked="option.isFree" @change="handleFreeChange(option)">始终免费</a-checkbox>
                <a-switch
                  v-model:checked="option.enabled"
                  checked-children="启用"
                  un-checked-children="停用"
                />
              </div>
            </div>

            <a-button type="text" danger @click="removeOption(groupIndex, optionIndex)"><DeleteOutlined /></a-button>
          </article>
        </div>

        <a-button type="dashed" block @click="addOption(groupIndex)"><PlusOutlined /> 新增选项</a-button>
      </a-collapse-panel>
    </a-collapse>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { message, Modal } from 'ant-design-vue'
import {
  CloseOutlined,
  DeleteOutlined,
  PictureOutlined,
  PlusOutlined,
  SaveOutlined,
  UndoOutlined,
  UploadOutlined,
} from '@ant-design/icons-vue'
import PageHeader from '@/components/PageHeader.vue'
import { errorMessage, get, post, uploadImage } from '@/api/http'
import { resolveMedia } from '@/utils/format'

interface Option {
  uid?: string
  optionCode: string
  title: string
  subtitle: string
  amount: number
  isFree: boolean
  freeThreshold: number
  enabled: boolean
  image: string
}

interface Group {
  uid: string
  groupCode: string
  title: string
  enabled: boolean
  options: Option[]
}

const uid = () => Math.random().toString(36).slice(2)
const option = (
  optionCode: string,
  title: string,
  subtitle: string,
  amount: number,
  isFree = false,
  freeThreshold = 0,
): Option => ({ optionCode, title, subtitle, amount, isFree, freeThreshold, enabled: true, image: '' })

const defaults: Array<Omit<Group, 'uid'>> = [
  {
    groupCode: 'productionMethod', title: '制作方式', enabled: true,
    options: [option('diy', '自己动手', '仅购买当前设计所需珠子', 0, true), option('assembled', '串好成品', '由工坊按当前设计串好后发出', 9.9)],
  },
  {
    groupCode: 'packaging', title: '包装方式', enabled: true,
    options: [option('normal', '普通包装', '随单附基础收纳包装', 0, true), option('gift', '礼盒包装', '适合作为礼物赠送', 10, false, 200)],
  },
  {
    groupCode: 'ropeColor', title: '选择绳线颜色', enabled: true,
    options: [option('transparent', '透明弹力线', '通用百搭，适合水晶与浅色珠', 0, true), option('black', '黑色弹力线', '适合深色珠与文玩质感', 0, true)],
  },
  {
    groupCode: 'shipping', title: '快递选择', enabled: true,
    options: [option('yunda', '韵达快递', '普通快递', 9, false, 99), option('sf', '顺丰快递', '顺丰配送', 18)],
  },
  {
    groupCode: 'greetingCard', title: '贺卡', enabled: true,
    options: [option('none', '无需贺卡', '不随单附赠贺卡', 0, true), option('greeting_card', '精美贺卡', '随礼盒附一张祝福贺卡', 1)],
  },
]

const loading = ref(false)
const saving = ref(false)
const groups = ref<Group[]>([])
const expanded = ref<string[]>([])
const uploadingOptionUid = ref('')

function isEnabled(value: unknown): boolean {
  return !(value === false || value === 0 || value === '0' || String(value ?? '').toLowerCase() === 'false')
}

function hydrate(input: any[]): Group[] {
  return defaults.map((fallback) => {
    const saved = input.find((group) => group?.groupCode === fallback.groupCode) || fallback
    const options = Array.isArray(saved.options) && saved.options.length ? saved.options : fallback.options
    return {
      groupCode: fallback.groupCode,
      title: String(saved.title || fallback.title),
      enabled: isEnabled(saved.enabled),
      uid: uid(),
      options: options.map((source: any) => {
        const fallbackOption = fallback.options.find((item) => item.optionCode === source?.optionCode)
        return {
        subtitle: '', isFree: false, image: '',
        ...fallbackOption,
        ...source,
        amount: Number(source?.amount || 0),
        freeThreshold: Number(source?.freeThreshold ?? fallbackOption?.freeThreshold ?? 0),
        enabled: isEnabled(source?.enabled),
        uid: uid(),
      }}),
    }
  })
}

async function load() {
  loading.value = true
  try {
    const data: any = await get('/api/admin/checkout_options_get')
    let parsed: any[] = []
    try { parsed = JSON.parse(data.value || '[]') } catch { parsed = [] }
    groups.value = hydrate(Array.isArray(parsed) ? parsed : [])
    expanded.value = groups.value.map((group) => group.uid)
  } catch (error) {
    message.error(errorMessage(error))
    groups.value = hydrate(defaults)
  } finally {
    loading.value = false
  }
}

function addOption(groupIndex: number) {
  groups.value[groupIndex]!.options.push({
    ...option(`option_${Date.now()}`, '新选项', '', 0, true),
    uid: uid(),
  })
}

function handleFreeChange(item: Option) {
  if (!item.isFree) return
  item.amount = 0
  item.freeThreshold = 0
}

function removeOption(groupIndex: number, optionIndex: number) {
  groups.value[groupIndex]!.options.splice(optionIndex, 1)
}

async function uploadOptionImage(request: any, item: Option) {
  uploadingOptionUid.value = item.uid || ''
  try {
    const result = await uploadImage(request.file as File)
    item.image = result.url
    request.onSuccess?.(result)
    message.success('图片上传成功')
  } catch (error) {
    request.onError?.(error)
    message.error(errorMessage(error))
  } finally {
    uploadingOptionUid.value = ''
  }
}

function uploadRequestFor(item: Option) {
  return (request: any) => uploadOptionImage(request, item)
}

function resetDefaults() {
  Modal.confirm({
    title: '恢复默认结算选项？',
    content: '当前未保存的修改会丢失。',
    onOk() {
      groups.value = hydrate(defaults)
      expanded.value = groups.value.map((group) => group.uid)
    },
  })
}

async function save() {
  if (groups.value.some((group) => !group.title.trim() || !group.options.length)) {
    message.warning('每个分组都需要标题和至少一个选项')
    return
  }
  for (const group of groups.value) {
    const optionCodes = group.options.map((item) => item.optionCode.trim())
    if (group.options.some((item) => !item.title.trim() || !item.optionCode.trim())) {
      message.warning(`“${group.title}”存在空的名称或编码`)
      return
    }
    if (new Set(optionCodes).size !== optionCodes.length) {
      message.warning(`“${group.title}”的选项编码不能重复`)
      return
    }
    const enabledOptions = group.options.filter((item) => item.enabled)
    if (group.enabled && !enabledOptions.length) {
      message.warning(`“${group.title}”启用时至少需要一个启用选项`)
      return
    }
  }

  saving.value = true
  try {
    const payload = groups.value.map(({ uid: _uid, options, ...group }) => ({
      ...group,
      enabled: Boolean(group.enabled),
      options: options.map(({ uid: _optionUid, ...item }) => ({
        ...item,
        amount: item.isFree ? 0 : Number(item.amount || 0),
        freeThreshold: item.isFree ? 0 : Number(item.freeThreshold || 0),
        enabled: Boolean(item.enabled),
      })),
    }))
    await post('/api/admin/checkout_options_update', { value: JSON.stringify(payload) })
    message.success('结算选项已保存并发布')
  } catch (error) {
    message.error(errorMessage(error))
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.option-collapse { background: transparent; }
.group-panel { margin-bottom: 14px; overflow: hidden; border: 1px solid rgba(30, 89, 73, .1) !important; border-radius: 16px !important; background: #fff; box-shadow: 0 8px 26px rgba(23, 67, 56, .045); }
.group-panel--disabled { background: #fafafa; }
.group-header { display: flex; align-items: center; width: 100%; gap: 12px; }
.group-index { display: grid; place-items: center; width: 30px; height: 30px; flex: 0 0 30px; border-radius: 9px; color: #2d6a59; background: #e9f3ef; font-weight: 700; }
.group-header__copy { display: flex; min-width: 0; flex: 1; flex-direction: column; }
.group-header small { color: #9aa6a1; font-size: 10px; }
.group-config { padding-top: 8px; }
.option-list { display: flex; flex-direction: column; margin-bottom: 12px; gap: 10px; }
.option-card { display: grid; grid-template-columns: minmax(0, 1fr) 36px; align-items: center; padding: 14px; border: 1px solid #e7ecea; border-radius: 12px; background: #fafbfa; gap: 12px; }
.option-card.disabled { opacity: .62; background: #f5f5f5; }
.option-editor { min-width: 0; }
.option-fields { display: grid; grid-template-columns: 1fr 1fr 1.4fr 120px 130px; align-items: end; gap: 10px; }
.option-fields label { display: flex; min-width: 0; flex-direction: column; gap: 5px; }
.option-fields label > small { color: #7f8d88; font-size: 11px; }
.option-image-upload { display: flex; align-items: center; margin-top: 12px; padding: 10px; border: 1px dashed #d7e1dd; border-radius: 10px; background: rgba(255, 255, 255, .72); gap: 12px; }
.option-image-preview { display: grid; width: 64px; height: 64px; flex: 0 0 64px; place-items: center; overflow: hidden; border-radius: 9px; color: #91a39c; background: #edf3f0; font-size: 24px; }
.option-image-preview img { width: 100%; height: 100%; object-fit: cover; }
.option-image-actions { display: flex; min-width: 0; flex-direction: column; gap: 4px; }
.option-image-actions small { color: #98a39f; }
.option-image-actions > div { display: flex; align-items: center; margin-top: 4px; gap: 5px; }
.option-switches { display: flex; align-items: center; justify-content: flex-end; margin-top: 10px; gap: 18px; }
@media (max-width: 1280px) { .option-fields { grid-template-columns: repeat(2, minmax(0, 1fr)); } .option-fields__wide { grid-column: span 2; } }
@media (max-width: 600px) { .option-card { grid-template-columns: minmax(0, 1fr) 32px; } .option-fields { grid-template-columns: 1fr; } .option-fields__wide { grid-column: auto; } }
</style>
