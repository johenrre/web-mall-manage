<template>
  <div class="page-shell">
    <PageHeader title="系统设置" description="配置经营规则、小程序展示、内容资料与微信支付">
      <a-button :loading="loading" @click="load"><ReloadOutlined /> 放弃修改</a-button>
      <a-button type="primary" :loading="saving" @click="save"><SaveOutlined /> 保存全部设置</a-button>
    </PageHeader>

    <a-alert
      type="warning"
      show-icon
      message="AppSecret 和支付密钥属于敏感信息"
      description="输入内容已隐藏，请只向必要的管理员开放本页面。"
    />

    <a-skeleton v-if="loading" active :paragraph="{ rows: 14 }" />
    <a-card v-else class="settings-card surface-card" :bordered="false">
      <a-tabs v-model:active-key="tab" tab-position="left" class="settings-tabs">
        <a-tab-pane key="business">
          <template #tab><span><FundOutlined /> 经营设置</span></template>
          <div class="settings-content">
            <div class="section-intro">
              <h2>经营与规则</h2>
              <p>设置分类展示和售后基础规则。</p>
            </div>
            <!-- 暂时隐藏推广分佣，后续需要时取消本段注释即可恢复。
            <section class="setting-section">
              <h3 class="setting-section-title">推广分佣</h3>
              <div class="form-grid">
                <a-form-item label="一级推广分佣比例">
                  <a-input-number v-model:value="form.commission_rate_percent" :min="0" :max="100" :precision="2" addon-after="%" style="width: 100%" />
                  <div class="field-help">直接下级消费后，上级获得的实付金额比例</div>
                </a-form-item>
                <a-form-item label="二级推广分佣比例">
                  <a-input-number v-model:value="form.commission_rate_level2_percent" :min="0" :max="100" :precision="2" addon-after="%" style="width: 100%" />
                  <div class="field-help">下下级消费后，二级推广人获得的比例</div>
                </a-form-item>
              </div>
            </section>
            -->
            <section class="setting-section">
              <h3 class="setting-section-title">商城规则</h3>
              <a-form-item label="盘珠分类展示顺序">
                <a-input v-model:value="form.bead_category_order" placeholder="水晶,沉香,菩提,文玩,配饰" />
                <div class="field-help">使用英文逗号分隔，只改变显示顺序</div>
              </a-form-item>
              <!-- 暂时隐藏积分规则，后续需要时取消本段注释即可恢复。
              <a-form-item label="积分规则说明">
                <a-textarea v-model:value="form.points_rule_text" :rows="4" />
              </a-form-item>
              -->
              <a-form-item label="售后退货地址">
                <a-textarea v-model:value="form.refund_return_address" :rows="4" placeholder="收件人、电话、详细地址和注意事项" />
              </a-form-item>
            </section>
          </div>
        </a-tab-pane>

        <a-tab-pane key="store">
          <template #tab><span><MobileOutlined /> 小程序展示</span></template>
          <div class="settings-content settings-content--wide">
            <div class="section-intro">
              <h2>小程序展示</h2>
              <p>管理小程序名称、首页轮播和用户可见信息。</p>
            </div>

            <section class="setting-section">
              <h3 class="setting-section-title">基础展示</h3>
              <a-form-item label="小程序名称">
                <a-input v-model:value="form.miniprogram_name" placeholder="显示在小程序首页的名称" />
              </a-form-item>
            </section>

            <section class="setting-section">
              <div class="section-toolbar">
                <div>
                  <h3 class="setting-section-title">首页轮播图</h3>
                  <p>按表格顺序展示；配置图片、标题和说明，按钮行为由小程序固定。</p>
                </div>
                <a-button type="primary" ghost @click="addSlide"><PlusOutlined /> 添加轮播</a-button>
              </div>

              <a-table
                class="slide-table"
                :columns="slideColumns"
                :data-source="slides"
                :pagination="false"
                :scroll="{ x: 820 }"
                row-key="rowKey"
                size="middle"
              >
                <template #emptyText>
                  <a-empty description="暂无轮播图，点击“添加轮播”开始配置" />
                </template>
                <template #bodyCell="{ column, record, index }">
                  <template v-if="column.key === 'image'">
                    <div class="slide-image-cell">
                      <div class="slide-image-preview">
                        <img v-if="record.image" :src="resolveMedia(record.image)" alt="轮播图预览" />
                        <PictureOutlined v-else />
                      </div>
                      <div class="slide-image-inputs">
                        <a-input v-model:value="record.image" placeholder="图片地址或上传图片" />
                        <a-upload
                          :show-upload-list="false"
                          accept="image/jpeg,image/png,image/gif,image/webp"
                          :before-upload="validateSlideFile"
                          :custom-request="(options: any) => uploadSlide(options, record)"
                        >
                          <a-button size="small" :loading="uploadingSlideKey === record.rowKey">
                            <UploadOutlined /> 上传图片
                          </a-button>
                        </a-upload>
                      </div>
                    </div>
                  </template>
                  <template v-else-if="column.key === 'title'">
                    <a-textarea v-model:value="record.title" :auto-size="{ minRows: 2, maxRows: 3 }" placeholder="例如：定义你的专属串珠" />
                  </template>
                  <template v-else-if="column.key === 'description'">
                    <a-textarea v-model:value="record.description" :auto-size="{ minRows: 2, maxRows: 4 }" placeholder="轮播图说明文案" />
                  </template>
                  <template v-else-if="column.key === 'actions'">
                    <a-space>
                      <a-button size="small" :disabled="index === 0" title="上移" @click="moveSlide(index, -1)"><ArrowUpOutlined /></a-button>
                      <a-button size="small" :disabled="index === slides.length - 1" title="下移" @click="moveSlide(index, 1)"><ArrowDownOutlined /></a-button>
                      <a-button size="small" danger title="删除" @click="removeSlide(record.rowKey)"><DeleteOutlined /></a-button>
                    </a-space>
                  </template>
                </template>
              </a-table>
              <div class="field-help">支持 JPG、PNG、GIF、WebP，单张不超过 5 MB。保存后由 /api/settings/public 提供给小程序。</div>
            </section>

            <section class="setting-section">
              <h3 class="setting-section-title">用户服务与售后</h3>
              <div class="form-grid">
                <a-form-item class="span-2" label="购买须知">
                  <a-textarea v-model:value="form.miniprogram_purchase_notice" :rows="4" placeholder="下单前向用户展示的说明" />
                </a-form-item>
                <a-form-item label="客服微信号">
                  <a-input v-model:value="contact.wechatId" placeholder="客服微信号" />
                </a-form-item>
                <a-form-item label="客服微信二维码">
                  <ImageUploader v-model="contact.wechatQr" />
                </a-form-item>
              </div>
            </section>

          </div>
        </a-tab-pane>

        <a-tab-pane key="content">
          <template #tab><span><ReadOutlined /> 内容资料</span></template>
          <div class="settings-content">
            <div class="section-intro">
              <h2>小程序内容资料</h2>
              <p>维护关于我们、购买指南、手围测量与珠子尺寸等说明。</p>
            </div>
            <JsonEditorCard
              v-for="item in jsonEditors"
              :key="item.key"
              v-model="form[item.key]"
              :title="item.title"
              :description="item.description"
            />
          </div>
        </a-tab-pane>

        <a-tab-pane key="integrations">
          <template #tab><span><ApiOutlined /> 登录与支付</span></template>
          <div class="settings-content">
            <div class="section-intro">
              <h2>登录与支付</h2>
              <p>仅保留微信小程序登录和微信支付配置。</p>
            </div>
            <section class="setting-section">
              <div class="switch-heading">
                <div>
                  <h3 class="setting-section-title">小程序微信登录</h3>
                  <p>AppID 和 AppSecret 用于微信登录、手机号授权等服务端能力。</p>
                </div>
                <a-switch v-model:checked="form.miniprogram_enabled" checked-children="启用" un-checked-children="停用" />
              </div>
              <div class="form-grid">
                <a-form-item label="小程序 AppID">
                  <a-input v-model:value="form.miniprogram_app_id" name="miniprogram-app-id" autocomplete="off" placeholder="wx 开头的 AppID" />
                </a-form-item>
                <a-form-item label="小程序 AppSecret">
                  <a-input-password v-model:value="form.miniprogram_app_secret" name="miniprogram-app-secret" autocomplete="new-password" placeholder="微信公众平台 AppSecret" />
                </a-form-item>
              </div>
            </section>
            <section class="setting-section">
              <div class="switch-heading">
                <div>
                  <h3 class="setting-section-title">微信支付（小程序）</h3>
                  <p>需要微信支付商户号、API v3 密钥、证书序列号和商户 API 私钥。</p>
                </div>
                <a-switch v-model:checked="form.wxpay_enabled" checked-children="启用" un-checked-children="停用" />
              </div>
              <div class="form-grid">
                <a-form-item label="支付 AppID">
                  <a-input v-model:value="form.wxpay_app_id" name="wxpay-app-id" autocomplete="off" placeholder="通常与小程序 AppID 相同" />
                </a-form-item>
                <a-form-item label="商户号 MchID">
                  <a-input v-model:value="form.wxpay_mch_id" name="wxpay-mch-id" autocomplete="off" />
                </a-form-item>
                <a-form-item label="API v3 Key">
                  <a-input-password v-model:value="form.wxpay_api_v3_key" name="wxpay-api-v3-key" autocomplete="new-password" />
                </a-form-item>
                <a-form-item label="商户证书序列号">
                  <a-input v-model:value="form.wxpay_mch_serial_no" name="wxpay-cert-serial" autocomplete="off" />
                </a-form-item>
                <a-form-item class="span-2" label="支付回调地址">
                  <a-input v-model:value="form.wxpay_notify_url" placeholder="https://域名/api/pay/notify_wxpay" />
                </a-form-item>
                <a-form-item class="span-2" label="商户 API 私钥">
                  <a-textarea v-model:value="form.wxpay_private_key" name="wxpay-private-key" autocomplete="off" :rows="6" class="secret-area" />
                </a-form-item>
              </div>
            </section>
          </div>
        </a-tab-pane>
      </a-tabs>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { message } from 'ant-design-vue'
import {
  ApiOutlined,
  ArrowDownOutlined,
  ArrowUpOutlined,
  DeleteOutlined,
  FundOutlined,
  MobileOutlined,
  PictureOutlined,
  PlusOutlined,
  ReadOutlined,
  ReloadOutlined,
  SaveOutlined,
  UploadOutlined,
} from '@ant-design/icons-vue'
import PageHeader from '@/components/PageHeader.vue'
import ImageUploader from '@/components/ImageUploader.vue'
import JsonEditorCard from '@/components/JsonEditorCard.vue'
import { errorMessage, get, post, uploadImage } from '@/api/http'
import { resolveMedia } from '@/utils/format'

interface EditableHomeSlide {
  rowKey: string
  image: string
  title: string
  description: string
}

const tab = ref('business')
const loading = ref(false)
const saving = ref(false)
const uploadingSlideKey = ref('')
const form = reactive<any>({})
const contact = reactive({ wechatId: '', wechatQr: '' })
const slides = ref<EditableHomeSlide[]>([])
let slideSequence = 0

const slideColumns = [
  { title: '主图', key: 'image', width: 310 },
  { title: '标题', key: 'title', width: 190 },
  { title: '说明', key: 'description', width: 240 },
  { title: '操作', key: 'actions', width: 150, fixed: 'right' },
]

const jsonEditors = [
  { key: 'about_us_json', title: '关于我们', description: '品牌名称、标语及中英文品牌介绍。' },
  { key: 'brand_philosophy_json', title: '品牌理念', description: '图标、名称与中英文说明条目。' },
  { key: 'guide_4steps_json', title: '四步使用指南', description: '图标、标题与中英文操作说明。' },
  { key: 'guide_notice_items_json', title: '购买须知条目', description: '购买前需要展示的中英文须知。' },
  { key: 'wrist_measurement_json', title: '手腕测量步骤', description: '测量步骤、图标、标题与中英文说明。' },
  { key: 'bead_size_json', title: '珠子尺寸说明', description: '尺寸、标签和中英文详细说明。' },
]

const stringKeys = [
  'bead_category_order',
  'points_rule_text',
  'refund_return_address',
  'miniprogram_app_id',
  'miniprogram_app_secret',
  'miniprogram_name',
  'miniprogram_purchase_notice',
  'wxpay_app_id',
  'wxpay_mch_id',
  'wxpay_api_v3_key',
  'wxpay_mch_serial_no',
  'wxpay_private_key',
  'wxpay_notify_url',
  ...jsonEditors.map((item) => item.key),
]
const boolKeys = ['miniprogram_enabled', 'wxpay_enabled']

function text(value: unknown): string {
  return String(value ?? '').trim()
}

function boolValue(value: unknown): boolean {
  return value === true || value === 1 || value === '1' || value === 'true'
}

function createSlide(source: any = {}): EditableHomeSlide {
  slideSequence += 1
  return {
    rowKey: `slide-${slideSequence}`,
    image: text(source.image || source.imageUrl || source.image_url || source.url),
    title: text(source.title),
    description: text(source.description || source.subtitle || source.desc),
  }
}

function parseSlides(value: unknown): EditableHomeSlide[] {
  try {
    const parsed = JSON.parse(text(value) || '[]')
    return Array.isArray(parsed) ? parsed.map(createSlide) : []
  } catch {
    message.error('数据库中的首页轮播配置格式错误，请重新配置')
    return []
  }
}

function serializeSlides(): string {
  if (!slides.value.length) return ''
  return JSON.stringify(slides.value.map((slide) => ({
    image: text(slide.image),
    title: text(slide.title),
    description: text(slide.description),
  })))
}

async function load() {
  loading.value = true
  try {
    const data: any = await get('/api/admin/settings_get')
    Object.assign(form, data, {
      commission_rate_percent: Number(data.commission_rate || 0) * 100,
      commission_rate_level2_percent: Number(data.commission_rate_level2 || 0) * 100,
    })
    for (const key of stringKeys) form[key] = String(data[key] ?? '')
    for (const key of boolKeys) form[key] = boolValue(data[key])
    slides.value = parseSlides(data.miniprogram_home_slides_json)
    try {
      Object.assign(contact, JSON.parse(data.contact_service_json || '{}'))
    } catch {
      Object.assign(contact, { wechatId: '', wechatQr: '' })
    }
  } catch (error) {
    message.error(errorMessage(error))
  } finally {
    loading.value = false
  }
}

function addSlide() {
  slides.value.push(createSlide())
}

function moveSlide(index: number, offset: number) {
  const target = index + offset
  if (target < 0 || target >= slides.value.length) return
  const [slide] = slides.value.splice(index, 1)
  if (slide) slides.value.splice(target, 0, slide)
}

function removeSlide(rowKey: string) {
  slides.value = slides.value.filter((slide) => slide.rowKey !== rowKey)
}

function validateSlideFile(file: File) {
  if (file.size > 5 * 1024 * 1024) {
    message.error('图片大小不能超过 5 MB')
    return false
  }
  if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
    message.error('仅支持 JPG、PNG、GIF、WebP 图片')
    return false
  }
  return true
}

async function uploadSlide(options: any, slide: EditableHomeSlide) {
  uploadingSlideKey.value = slide.rowKey
  try {
    const result = await uploadImage(options.file as File)
    slide.image = result.url
    options.onSuccess?.(result)
    message.success('轮播图片上传成功，请继续填写内容')
  } catch (error) {
    message.error(errorMessage(error))
    options.onError?.(error as Error)
  } finally {
    uploadingSlideKey.value = ''
  }
}

async function save() {
  if (
    form.commission_rate_percent < 0 ||
    form.commission_rate_percent > 100 ||
    form.commission_rate_level2_percent < 0 ||
    form.commission_rate_level2_percent > 100
  ) {
    return message.warning('分佣比例必须在 0% 到 100% 之间')
  }
  if (slides.value.some((slide) => !text(slide.image))) {
    return message.warning('每条轮播都必须填写图片地址或上传图片')
  }
  for (const item of jsonEditors) {
    const value = text(form[item.key])
    if (!value) continue
    try {
      const parsed = JSON.parse(value)
      if (!parsed || typeof parsed !== 'object') throw new Error('invalid')
    } catch {
      return message.error(`“${item.title}”JSON 格式不正确`)
    }
  }

  const payload: Record<string, unknown> = {
    commission_rate: Number(form.commission_rate_percent) / 100,
    commission_rate_level2: Number(form.commission_rate_level2_percent) / 100,
    contact_service_json: JSON.stringify(contact),
    miniprogram_home_slides_json: serializeSlides(),
  }
  for (const key of stringKeys) payload[key] = String(form[key] ?? '').trim()
  for (const key of boolKeys) payload[key] = Boolean(form[key])

  saving.value = true
  try {
    await post('/api/admin/settings_update', payload)
    message.success('小程序设置已保存并生效')
    await load()
  } catch (error) {
    message.error(errorMessage(error))
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.settings-card :deep(.ant-card-body) { padding: 0; }
.settings-tabs { min-height: 700px; }
.settings-tabs :deep(.ant-tabs-nav) { width: 180px; margin: 0; padding: 20px 12px; border-right: 1px solid #edf1ef; }
.settings-tabs :deep(.ant-tabs-tab) { padding: 12px 14px !important; border-radius: 9px; }
.settings-tabs :deep(.ant-tabs-tab-active) { background: #edf5f1; }
.settings-tabs :deep(.ant-tabs-content-holder) { min-width: 0; padding: 28px; }
.settings-content { display: flex; max-width: 900px; flex-direction: column; gap: 18px; }
.settings-content--wide { max-width: 1180px; }
.section-intro { margin-bottom: 2px; }
.section-intro h2 { margin: 0; color: #23473c; font: 700 24px Georgia, 'Noto Serif SC', serif; }
.section-intro p,
.switch-heading p,
.section-toolbar p { margin: 5px 0 0; color: #8b9893; font-size: 12px; }
.switch-heading,
.section-toolbar { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; margin-bottom: 18px; }
.switch-heading .setting-section-title,
.section-toolbar .setting-section-title { margin-bottom: 0; }
.field-help { margin-top: 10px; color: #96a29d; font-size: 11px; }
.secret-area { font-family: 'SFMono-Regular', Consolas, monospace; }
.slide-table { overflow: hidden; border: 1px solid #e5ece8; border-radius: 12px; }
.slide-table :deep(.ant-table-thead > tr > th) { color: #49645b; background: #f4f8f6; font-size: 12px; }
.slide-table :deep(.ant-table-cell) { vertical-align: top; }
.slide-image-cell { display: flex; align-items: flex-start; gap: 10px; }
.slide-image-preview { display: grid; width: 96px; height: 64px; overflow: hidden; flex: 0 0 96px; place-items: center; border: 1px dashed #cbd8d2; border-radius: 9px; color: #93a39c; background: #f5f8f7; font-size: 22px; }
.slide-image-preview img { width: 100%; height: 100%; object-fit: cover; }
.slide-image-inputs { display: flex; min-width: 180px; flex: 1; flex-direction: column; align-items: flex-start; gap: 7px; }

@media (max-width: 850px) {
  .settings-tabs { flex-direction: column; }
  .settings-tabs :deep(.ant-tabs-nav) { width: 100%; margin: 0; padding: 8px; border-right: 0; }
  .settings-tabs :deep(.ant-tabs-nav-list) { overflow: auto; }
  .settings-tabs :deep(.ant-tabs-content-holder) { padding: 18px; }
}
</style>
