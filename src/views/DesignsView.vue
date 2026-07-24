<template>
  <div class="page-shell design-workspace">
    <PageHeader title="设计管理" description="统一管理用户方案、审核状态、珠材构成与灵感广场展示">
      <a-input-search
        v-model:value="keyword"
        allow-clear
        placeholder="作品名 / 作者 / 作品编号"
        class="header-search"
        @search="search"
      />
      <a-button :loading="loading" @click="refresh"><ReloadOutlined /> 刷新</a-button>
    </PageHeader>

    <section class="operation-bar">
      <button class="review-queue" :class="{ urgent: pendingCount > 0 }" @click="selectStatus('pending')">
        <span class="queue-icon"><ClockCircleOutlined /></span>
        <span>
          <small>待审核队列</small>
          <b>{{ pendingCount }}</b>
          <em>{{ pendingCount > 0 ? '有作品需要处理' : '当前没有待审作品' }}</em>
        </span>
        <RightOutlined />
      </button>

      <div class="type-filter">
        <div>
          <small>作品归属</small>
          <span>区分设计师投稿与用户客订</span>
        </div>
        <a-segmented v-model:value="type" :options="typeOptions" @change="search" />
      </div>
    </section>

    <a-card class="surface-card design-list-card" :bordered="false">
      <div class="list-toolbar">
        <div>
          <b>{{ statusLabel }}</b>
          <span>共 {{ total }} 个作品，点击整行查看设计、珠材和运营信息</span>
        </div>
        <a-segmented v-model:value="status" :options="statusOptions" @change="search" />
      </div>

      <a-table
        row-key="id"
        :columns="columns"
        :data-source="designs"
        :loading="loading"
        :pagination="pagination"
        :scroll="{x:1320}"
        :custom-row="designRow"
        row-class-name="design-row"
        @change="onTableChange"
      >
        <template #bodyCell="{column,record}">
          <template v-if="column.key==='design'">
            <div class="design-cell">
              <button class="preview-button" aria-label="查看作品详情" @click.stop="openDetail(record)">
                <BraceletPreview
                  :pattern="record.pattern"
                  :material-map="record.material_map||record.materialMap"
                  :size="80"
                />
              </button>
              <div>
                <b>{{ record.name||'未命名作品' }}</b>
                <span class="design-code">{{ record.design_code||`#${record.id}` }}</span>
                <small>{{ record.bead_count||0 }} 颗 · {{ materialsOf(record).length }} 种珠材</small>
              </div>
            </div>
          </template>

          <template v-else-if="column.key==='author'">
            <div class="author-cell">
              <a-avatar :src="resolveMedia(record.avatar)" :size="38">{{ authorInitial(record) }}</a-avatar>
              <div>
                <b>{{ record.nickname||`用户 ${record.user_id}` }}</b>
                <small>UID {{ record.user_id }}</small>
              </div>
            </div>
          </template>

          <template v-else-if="column.key==='type'">
            <a-tag :color="resolvedType(record)==='designer'?'cyan':'purple'" :bordered="false">
              {{ typeLabel(resolvedType(record)) }}
            </a-tag>
            <span class="type-description">
              {{ resolvedType(record)==='designer'?'品牌设计内容':resolvedType(record)==='customer'?'用户投稿方案':'尚未设置展示归属' }}
            </span>
          </template>

          <template v-else-if="column.key==='materials'">
            <div class="material-summary">
              <div v-for="material in materialsOf(record).slice(0,3)" :key="material.id">
                <a-image
                  v-if="material.image"
                  :src="resolveMedia(material.image)"
                  :width="25"
                  :height="25"
                  :preview="false"
                />
                <span v-else class="material-fallback">{{ material.name.slice(0,1)||'珠' }}</span>
                <span>{{ material.name }}</span>
                <b>×{{ material.count }}</b>
              </div>
              <small v-if="materialsOf(record).length>3">另有 {{ materialsOf(record).length-3 }} 种</small>
              <span v-if="!materialsOf(record).length" class="muted">无可识别珠材</span>
            </div>
          </template>

          <template v-else-if="column.key==='commerce'">
            <div class="commerce-cell">
              <b>{{ money(record.price) }}</b>
              <span>{{ formatNumber(record.perimeter) }} mm</span>
              <small><PictureOutlined /> {{ photoList(record).length }} 张实拍</small>
            </div>
          </template>

          <template v-else-if="column.key==='engagement'">
            <div class="engagement-cell">
              <span><EyeOutlined /> {{ record.view_count||0 }}</span>
              <span><HeartOutlined /> {{ record.like_count||0 }}</span>
              <span><ShareAltOutlined /> {{ record.share_count||0 }}</span>
            </div>
          </template>

          <template v-else-if="column.key==='status'">
            <StatusTag :status="record.inspiration_status" :map="designStatusMap" />
            <span class="status-time">
              {{ record.inspiration_submitted_at?'投稿':'创建' }}于
              {{ dateTime(record.inspiration_submitted_at||record.created_at) }}
            </span>
          </template>

          <template v-else-if="column.key==='action'">
            <div class="row-action" @click.stop>
              <a-button type="link" @click="openDetail(record)">查看详情 <RightOutlined /></a-button>
            </div>
          </template>
        </template>

        <template #emptyText>
          <a-empty description="当前筛选条件下没有作品" />
        </template>
      </a-table>
    </a-card>

    <a-drawer
      v-model:open="detailOpen"
      :width="940"
      title="作品运营详情"
      class="design-detail-drawer"
    >
      <template v-if="selected">
        <section class="detail-hero">
          <div class="bracelet-stage">
            <BraceletPreview
              :pattern="selected.pattern"
              :material-map="selected.material_map||selected.materialMap"
              :size="290"
            />
          </div>

          <div class="detail-intro">
            <div class="detail-tags">
              <StatusTag :status="selected.inspiration_status" :map="designStatusMap" />
              <a-tag :color="resolvedType(selected)==='designer'?'cyan':'purple'" :bordered="false">
                {{ typeLabel(resolvedType(selected)) }}
              </a-tag>
              <span>{{ selected.design_code||`作品 #${selected.id}` }}</span>
            </div>
            <h2>{{ selected.name||'未命名作品' }}</h2>
            <div class="author-profile">
              <a-avatar :src="resolveMedia(selected.avatar)" :size="42">{{ authorInitial(selected) }}</a-avatar>
              <div>
                <b>{{ selected.nickname||`用户 ${selected.user_id}` }}</b>
                <span>作者 UID {{ selected.user_id }}</span>
              </div>
            </div>
            <div class="detail-metrics">
              <div><small>作品售价</small><b>{{ money(selected.price) }}</b></div>
              <div><small>珠子数量</small><b>{{ selected.bead_count||0 }} 颗</b></div>
              <div><small>珠材种类</small><b>{{ materialsOf(selected).length }} 种</b></div>
              <div><small>设计周长</small><b>{{ formatNumber(selected.perimeter) }} mm</b></div>
            </div>
            <span class="detail-time"><ClockCircleOutlined /> {{ dateTime(selected.inspiration_submitted_at||selected.created_at) }}</span>
          </div>
        </section>

        <section class="operation-metrics">
          <div><EyeOutlined /><span><small>浏览</small><b>{{ selected.view_count||0 }}</b></span></div>
          <div><HeartOutlined /><span><small>点赞</small><b>{{ selected.like_count||0 }}</b></span></div>
          <div><ShareAltOutlined /><span><small>分享</small><b>{{ selected.share_count||0 }}</b></span></div>
          <div><PictureOutlined /><span><small>实拍素材</small><b>{{ photoList(selected).length }} 张</b></span></div>
        </section>

        <section class="detail-section">
          <div class="section-title">
            <div>
              <b>珠材构成</b>
              <span>由作品的 pattern 和 material_map 在管理端实时汇总</span>
            </div>
            <a-tag :bordered="false">{{ materialsOf(selected).length }} 种 / {{ selected.bead_count||0 }} 颗</a-tag>
          </div>
          <a-table
            row-key="id"
            size="small"
            :columns="materialColumns"
            :data-source="materialsOf(selected)"
            :pagination="false"
            class="material-table"
          >
            <template #bodyCell="{column,record}">
              <template v-if="column.key==='material'">
                <div class="detail-material">
                  <a-image
                    v-if="record.image"
                    :src="resolveMedia(record.image)"
                    :width="44"
                    :height="44"
                    class="material-image"
                  />
                  <div v-else class="material-image fallback">{{ record.name.slice(0,1)||'珠' }}</div>
                  <div>
                    <b>{{ record.name }}</b>
                    <span>{{ record.category||'未分类' }} · {{ record.subcategory||record.color_family||'未设置子分类' }}</span>
                  </div>
                </div>
              </template>
              <template v-else-if="column.key==='spec'">
                <b>{{ formatNumber(record.size) }} mm</b>
                <span class="table-secondary">{{ materialTypeLabel(String(record.type||'')) }}</span>
              </template>
              <template v-else-if="column.key==='render'">
                <div class="render-tags">
                  <a-tag :color="record.stringing_position==='top'?'blue':'default'" :bordered="false">
                    {{ record.stringing_position==='top'?'顶部穿线':'中心穿线' }}
                  </a-tag>
                  <a-tag v-if="record.is_irregular" color="orange" :bordered="false">异形</a-tag>
                </div>
                <span class="table-secondary">
                  占位 {{ positiveNumber(record.stringing_width_mm)||formatNumber(record.size) }} mm
                </span>
              </template>
              <template v-else-if="column.key==='quantity'"><b>× {{ record.count }}</b></template>
              <template v-else-if="column.key==='amount'">
                <span>{{ money(record.price) }}</span>
                <b>{{ money(record.subtotal) }}</b>
              </template>
            </template>
            <template #emptyText><a-empty description="作品没有可识别的珠材" /></template>
          </a-table>
        </section>

        <section class="detail-section">
          <div class="section-title">
            <div>
              <b>排列顺序</b>
              <span>按照设计数据中的位置依次展示</span>
            </div>
            <span class="sequence-count">{{ patternSequence(selected).length }} 个位置</span>
          </div>
          <div v-if="patternSequence(selected).length" class="sequence-scroll">
            <div
              v-for="item in patternSequence(selected)"
              :key="`${item.index}-${item.id}`"
              class="sequence-item"
              :title="item.name"
            >
              <span>{{ item.index+1 }}</span>
              <a-image
                v-if="item.image"
                :src="resolveMedia(item.image)"
                :width="38"
                :height="38"
                :preview="false"
              />
              <div v-else>{{ item.name.slice(0,1)||'珠' }}</div>
              <small>{{ item.name }}</small>
            </div>
          </div>
          <a-empty v-else description="暂无排列数据" />
        </section>

        <section class="detail-section">
          <div class="section-title">
            <div>
              <b>作品实拍</b>
              <span>用于灵感广场展示成品质感和细节</span>
            </div>
            <a-button size="small" @click="openPhotos(selected)"><PictureOutlined /> 管理实拍图</a-button>
          </div>
          <div v-if="photoList(selected).length" class="live-photo-grid">
            <a-image v-for="photo in photoList(selected)" :key="photo" :src="resolveMedia(photo)" />
          </div>
          <a-empty v-else description="还没有上传作品实拍图">
            <a-button type="primary" ghost @click="openPhotos(selected)">立即上传</a-button>
          </a-empty>
        </section>

        <section v-if="selected.inspiration_reject_reason" class="review-note">
          <StopOutlined />
          <div>
            <b>最近一次驳回 / 下架原因</b>
            <span>{{ selected.inspiration_reject_reason }}</span>
          </div>
        </section>
      </template>

      <template #footer>
        <div class="detail-footer">
          <span>审核会影响作品在灵感广场的展示状态</span>
          <div v-if="selected">
            <a-button @click="openPhotos(selected)"><PictureOutlined /> 实拍图</a-button>
            <a-button
              v-if="selected.inspiration_status==='pending'||selected.inspiration_status==='approved'"
              danger
              @click="openReview(selected,'reject',resolvedType(selected)||'customer')"
            >
              {{ selected.inspiration_status==='approved'?'下架':'驳回' }}
            </a-button>
            <a-button
              type="primary"
              @click="openReview(selected,'approve',resolvedType(selected)||'customer')"
            >
              {{ selected.inspiration_status==='approved'?'调整展示分类':'通过并展示' }}
            </a-button>
          </div>
        </div>
      </template>
    </a-drawer>

    <a-modal
      v-model:open="reviewOpen"
      :title="reviewForm.action==='reject'?(selected?.inspiration_status==='approved'?'下架作品':'驳回作品'):'确认作品展示'"
      :ok-text="reviewForm.action==='reject'?'确认提交':'确认并展示'"
      :ok-button-props="{danger:reviewForm.action==='reject'}"
      :confirm-loading="saving"
      @ok="submitReview"
    >
      <a-alert
        :type="reviewForm.action==='reject'?'warning':'success'"
        show-icon
        class="modal-alert"
        :message="selected?.name||'未命名作品'"
      />
      <a-form layout="vertical">
        <a-form-item v-if="reviewForm.action==='approve'" label="灵感广场展示分类" required>
          <a-radio-group v-model:value="reviewForm.type" class="review-type-options">
            <a-radio-button value="customer">用户客订</a-radio-button>
            <a-radio-button value="designer">设计师作品</a-radio-button>
          </a-radio-group>
          <span class="form-help">展示分类决定作品进入小程序中的哪个内容分区。</span>
        </a-form-item>
        <a-form-item
          :label="reviewForm.action==='reject'?'驳回 / 下架原因':'审核备注'"
          :required="reviewForm.action==='reject'"
        >
          <a-textarea
            v-model:value="reviewForm.reason"
            :rows="4"
            maxlength="300"
            show-count
            :placeholder="reviewForm.action==='reject'?'请说明具体问题，便于后续处理':'可填写内部审核说明'"
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <a-modal
      v-model:open="photosOpen"
      title="维护作品实拍图"
      :width="720"
      ok-text="保存实拍图"
      :confirm-loading="saving"
      @ok="savePhotos"
    >
      <div class="photo-modal-summary">
        <div>
          <b>{{ selected?.name||'未命名作品' }}</b>
          <span>已添加 {{ photoDraft.length }} / 12 张</span>
        </div>
        <small>建议上传整体、局部和佩戴效果，第一张将优先展示。</small>
      </div>
      <a-upload-dragger
        :show-upload-list="false"
        accept="image/*"
        :custom-request="uploadPhoto"
        multiple
      >
        <p class="ant-upload-drag-icon"><InboxOutlined /></p>
        <p class="ant-upload-text">拖拽或点击上传实拍图</p>
        <p class="ant-upload-hint">支持 JPG、PNG、GIF、WebP，每张不超过 5 MB</p>
      </a-upload-dragger>
      <div v-if="photoDraft.length" class="photo-grid">
        <div v-for="(photo,index) in photoDraft" :key="photo">
          <span>{{ index+1 }}</span>
          <a-image :src="resolveMedia(photo)" />
          <button aria-label="删除实拍图" @click.stop="photoDraft.splice(index,1)"><DeleteOutlined /></button>
        </div>
      </div>
      <a-empty v-else description="暂未添加实拍图" class="photo-empty" />
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed,onMounted,reactive,ref } from 'vue'
import { message } from 'ant-design-vue'
import {
  ClockCircleOutlined,DeleteOutlined,EyeOutlined,HeartOutlined,InboxOutlined,
  PictureOutlined,ReloadOutlined,RightOutlined,ShareAltOutlined,StopOutlined,
} from '@ant-design/icons-vue'
import PageHeader from '@/components/PageHeader.vue'
import BraceletPreview from '@/components/BraceletPreview.vue'
import StatusTag from '@/components/StatusTag.vue'
import { errorMessage,get,post,uploadImage } from '@/api/http'
import {
  designMaterials as materialsOf,
  designPhotos as photoList,
  designSequence as patternSequence,
} from '@/utils/design'
import { dateTime,listFrom,money,resolveMedia,totalFrom } from '@/utils/format'

type WorkStatus='all'|'pending'|'approved'|'rejected'|'private'
type WorkType='all'|'designer'|'customer'
type ReviewType='designer'|'customer'
type ReviewAction='approve'|'reject'

const designStatusMap:Record<string,{text:string;color:string}>={
  pending:{text:'待审核',color:'gold'},
  approved:{text:'展示中',color:'green'},
  rejected:{text:'已下架',color:'red'},
  private:{text:'未发布',color:'default'},
}
const statusOptions:{label:string;value:WorkStatus}[]=[
  {label:'全部',value:'all'},
  {label:'待审核',value:'pending'},
  {label:'展示中',value:'approved'},
  {label:'已下架',value:'rejected'},
  {label:'未发布',value:'private'},
]
const typeOptions:{label:string;value:WorkType}[]=[
  {label:'全部作品',value:'all'},
  {label:'设计师作品',value:'designer'},
  {label:'用户客订',value:'customer'},
]
const columns=[
  {title:'作品',key:'design',width:280},
  {title:'作者',key:'author',width:160},
  {title:'内容归属',key:'type',width:150},
  {title:'主要珠材',key:'materials',width:225},
  {title:'售价 / 素材',key:'commerce',width:125},
  {title:'互动数据',key:'engagement',width:135},
  {title:'状态 / 时间',key:'status',width:165},
  {title:'操作',key:'action',width:115,fixed:'right' as const},
]
const materialColumns=[
  {title:'珠材',key:'material',width:270},
  {title:'规格',key:'spec',width:100},
  {title:'DIY 配置',key:'render',width:200},
  {title:'数量',key:'quantity',width:80},
  {title:'单价 / 小计',key:'amount',width:130},
]
const materialTypeLabels:Record<string,string>={
  crystal:'水晶',stone:'石质',glass:'玻璃',wood:'木质',
  metal:'金属',peishi:'配饰',accessory:'配饰',chenxiang:'沉香',
}

const loading=ref(false)
const saving=ref(false)
const designs=ref<Record<string,any>[]>([])
const keyword=ref('')
const type=ref<WorkType>('all')
const status=ref<WorkStatus>('all')
const page=ref(1)
const pageSize=ref(20)
const total=ref(0)
const pendingCount=ref(0)
const selected=ref<Record<string,any>>()
const detailOpen=ref(false)
const reviewOpen=ref(false)
const photosOpen=ref(false)
const photoDraft=ref<string[]>([])
const reviewForm=reactive<{action:ReviewAction;type:ReviewType;reason:string}>({
  action:'approve',
  type:'customer',
  reason:'',
})

const pagination=computed(()=>({
  current:page.value,
  pageSize:pageSize.value,
  total:total.value,
  showSizeChanger:true,
  showQuickJumper:true,
  showTotal:(value:number)=>`共 ${value} 个作品`,
}))
const statusLabel=computed(()=>statusOptions.find(item=>item.value===status.value)?.label||'全部作品')

function resolvedType(record:Record<string,any>|undefined):ReviewType|''{
  const value=String(record?.inspiration_type||'').toLowerCase()
  if(value==='designer'||value==='customer')return value
  return Number(record?.is_featured||0)>0?'designer':''
}
function typeLabel(value:ReviewType|''){return value==='designer'?'设计师作品':value==='customer'?'用户客订':'未分类'}
function authorInitial(record:Record<string,any>){return String(record.nickname||record.user_id||'用').slice(0,1)}
function formatNumber(value:unknown){const number=Number(value);return Number.isFinite(number)?Number(number.toFixed(1)).toString():'0'}
function positiveNumber(value:unknown){const number=Number(value);return Number.isFinite(number)&&number>0?formatNumber(number):''}
function materialTypeLabel(value:string){return materialTypeLabels[value]||value||'未设置'}
function designRow(record:Record<string,any>){return{onClick:()=>openDetail(record)}}

async function requestDesigns(
  targetStatus:WorkStatus=status.value,
  targetType:WorkType=type.value,
  pageValue=page.value,
  size=pageSize.value,
){
  return get('/api/admin/design_list',{
    keyword:keyword.value.trim(),
    type:targetType,
    status:targetStatus,
    page:pageValue,
    page_size:size,
  })
}
async function load(){
  loading.value=true
  try{
    const data:any=await requestDesigns()
    designs.value=listFrom(data)
    total.value=totalFrom(data,designs.value.length)
  }catch(error){
    message.error(errorMessage(error))
  }finally{
    loading.value=false
  }
}
async function loadPendingCount(){
  try{
    const data=await get('/api/admin/design_list',{status:'pending',type:'all',page:1,page_size:1})
    pendingCount.value=totalFrom(data,0)
  }catch{
    // 主列表会展示接口错误，队列数字失败时保持上次值。
  }
}
function refresh(){void Promise.all([load(),loadPendingCount()])}
function search(){page.value=1;void load()}
function selectStatus(value:WorkStatus){status.value=value;page.value=1;void load()}
function onTableChange(paginationValue:{current?:number;pageSize?:number}){
  page.value=paginationValue.current||1
  pageSize.value=paginationValue.pageSize||20
  void load()
}
function openDetail(row:Record<string,any>){selected.value=row;detailOpen.value=true}
function openReview(row:Record<string,any>,action:ReviewAction,nextType:ReviewType){
  selected.value=row
  Object.assign(reviewForm,{action,type:nextType,reason:''})
  reviewOpen.value=true
}
async function submitReview(){
  if(!selected.value)return
  if(reviewForm.action==='reject'&&!reviewForm.reason.trim()){
    message.warning('请填写驳回或下架原因')
    return
  }
  saving.value=true
  try{
    await post('/api/admin/design_review',{
      id:selected.value.id,
      action:reviewForm.action,
      type:reviewForm.type,
      reason:reviewForm.reason.trim(),
    })
    message.success(reviewForm.action==='reject'?'作品已停止展示':'作品展示状态已更新')
    reviewOpen.value=false
    detailOpen.value=false
    await Promise.all([load(),loadPendingCount()])
  }catch(error){
    message.error(errorMessage(error))
  }finally{
    saving.value=false
  }
}
function openPhotos(row:Record<string,any>){
  selected.value=row
  photoDraft.value=[...photoList(row)]
  photosOpen.value=true
}
async function uploadPhoto(options:any){
  if(photoDraft.value.length>=12){
    message.warning('最多上传 12 张实拍图')
    options.onError?.(new Error('最多上传 12 张实拍图'))
    return
  }
  try{
    const result=await uploadImage(options.file as File)
    if(photoDraft.value.length>=12){
      message.warning('最多保留 12 张实拍图')
      options.onError?.(new Error('最多保留 12 张实拍图'))
      return
    }
    photoDraft.value.push(result.url)
    options.onSuccess?.(result)
  }catch(error){
    message.error(errorMessage(error))
    options.onError?.(error as Error)
  }
}
async function savePhotos(){
  if(!selected.value)return
  saving.value=true
  try{
    await post('/api/admin/design_live_photos',{id:selected.value.id,livePhotos:photoDraft.value})
    selected.value={...selected.value,live_photos:[...photoDraft.value],productPhotos:[...photoDraft.value]}
    message.success('作品实拍图已保存')
    photosOpen.value=false
    await load()
  }catch(error){
    message.error(errorMessage(error))
  }finally{
    saving.value=false
  }
}

onMounted(()=>{void Promise.all([load(),loadPendingCount()])})
</script>

<style scoped>
.design-workspace{gap:16px}.header-search{width:290px}.operation-bar{display:grid;grid-template-columns:310px minmax(0,1fr);gap:14px}.review-queue{display:flex;align-items:center;gap:13px;padding:15px 17px;border:1px solid #e5ebe8;border-radius:15px;color:#476157;background:#fff;box-shadow:0 8px 24px rgba(31,74,62,.045);cursor:pointer;text-align:left}.review-queue.urgent{border-color:#ead7a9;background:linear-gradient(135deg,#fffaf0,#fff)}.queue-icon{display:grid;place-items:center;flex:0 0 42px;width:42px;height:42px;border-radius:12px;color:#a4772f;background:#fff3d7;font-size:18px}.review-queue>span:nth-child(2){display:grid;flex:1;grid-template-columns:auto 1fr;align-items:end;column-gap:8px}.review-queue small{grid-column:1;color:#7b8984;font-size:10px}.review-queue b{grid-column:1;color:#274d41;font-size:24px;line-height:1}.review-queue em{grid-column:2;grid-row:1/3;align-self:center;color:#97a19e;font-size:10px;font-style:normal}.review-queue>svg{color:#9ba8a3}.type-filter{display:flex;align-items:center;justify-content:space-between;gap:18px;padding:15px 18px;border:1px solid rgba(30,89,73,.08);border-radius:15px;background:#fff;box-shadow:0 8px 24px rgba(31,74,62,.045)}.type-filter>div{display:flex;flex-direction:column}.type-filter small{color:#35584d;font-size:12px;font-weight:700}.type-filter span{margin-top:3px;color:#98a39f;font-size:10px}
.design-list-card :deep(.ant-card-body){padding:0}.list-toolbar{display:flex;align-items:center;justify-content:space-between;gap:18px;padding:17px 19px;border-bottom:1px solid #edf1ef}.list-toolbar>div{display:flex;flex-direction:column}.list-toolbar b{color:#2b4f44;font-size:14px}.list-toolbar span{margin-top:4px;color:#95a09c;font-size:10px}.design-list-card :deep(.ant-table-thead>tr>th){padding:12px 14px;color:#667870;background:#f8faf9;font-size:10px}.design-list-card :deep(.ant-table-tbody>tr>td){padding:14px}.design-list-card :deep(.design-row){cursor:pointer}.design-list-card :deep(.design-row:hover>td){background:#f6faf8!important}
.design-cell{display:flex;align-items:center;gap:13px}.preview-button{display:grid;place-items:center;flex:0 0 82px;width:82px;height:82px;padding:0;border:1px solid #e1e9e5;border-radius:50%;background:#f8faf9;cursor:pointer}.design-cell>div:last-child{display:flex;min-width:0;flex-direction:column}.design-cell b{max-width:155px;overflow:hidden;color:#294a40;font-size:12px;text-overflow:ellipsis;white-space:nowrap}.design-code{margin-top:4px;color:#9aa59f;font:9px Consolas,monospace}.design-cell small{margin-top:5px;color:#7f8f88;font-size:9px}.author-cell{display:flex;align-items:center;gap:10px}.author-cell>div{display:flex;min-width:0;flex-direction:column}.author-cell b{max-width:95px;overflow:hidden;color:#455c54;font-size:11px;text-overflow:ellipsis;white-space:nowrap}.author-cell small{margin-top:4px;color:#99a39f;font-size:9px}.type-description{display:block;max-width:125px;margin-top:5px;color:#98a29e;font-size:9px;line-height:1.4}.material-summary{display:flex;flex-direction:column;gap:5px}.material-summary>div{display:grid;grid-template-columns:25px minmax(0,1fr) auto;align-items:center;gap:6px}.material-summary :deep(.ant-image),.material-summary :deep(img){border-radius:50%;object-fit:contain;background:#f0f4f2}.material-fallback{display:grid;place-items:center;width:25px;height:25px;border-radius:50%;color:#809088;background:#edf2ef;font-size:9px}.material-summary>div>span:nth-child(2){overflow:hidden;color:#64766f;font-size:9px;text-overflow:ellipsis;white-space:nowrap}.material-summary>div>b{color:#8e6b31;font-size:9px}.material-summary>small{padding-left:31px;color:#a0aaa5;font-size:8px}.commerce-cell{display:flex;flex-direction:column}.commerce-cell>b{color:#ad762d;font-size:13px}.commerce-cell>span{margin-top:5px;color:#667a72;font-size:10px}.commerce-cell>small{margin-top:5px;color:#9aa49f;font-size:9px}.engagement-cell{display:flex;flex-direction:column;gap:5px}.engagement-cell span{display:flex;align-items:center;gap:5px;color:#71827b;font-size:10px}.engagement-cell svg{color:#9aa9a3}.status-time{display:block;margin-top:6px;color:#99a49f;font-size:9px;line-height:1.4}.row-action{white-space:nowrap}
.design-detail-drawer :deep(.ant-drawer-body){padding:18px;background:#f7f9f8}.design-detail-drawer :deep(.ant-drawer-footer){padding:12px 18px}.detail-hero{display:grid;grid-template-columns:330px minmax(0,1fr);gap:22px;margin-bottom:15px;padding:18px;border:1px solid #dfeae5;border-radius:17px;background:linear-gradient(135deg,#edf6f2,#f8faf8)}.bracelet-stage{display:grid;place-items:center;min-height:300px;border-radius:15px;background:rgba(255,255,255,.72)}.detail-intro{display:flex;flex-direction:column;justify-content:center}.detail-tags{display:flex;align-items:center;gap:6px}.detail-tags>span:last-child{color:#99a49f;font:9px Consolas,monospace}.detail-intro h2{margin:13px 0 12px;color:#204b3e;font:700 23px Georgia,'Noto Serif SC',serif}.author-profile{display:flex;align-items:center;gap:10px}.author-profile>div{display:flex;flex-direction:column}.author-profile b{color:#405b52;font-size:12px}.author-profile span{margin-top:3px;color:#97a29e;font-size:9px}.detail-metrics{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-top:17px}.detail-metrics>div{display:flex;flex-direction:column;padding:10px;border-radius:10px;background:rgba(255,255,255,.72)}.detail-metrics small{color:#91a09a;font-size:9px}.detail-metrics b{margin-top:3px;color:#2e5f50;font-size:14px}.detail-time{margin-top:12px;color:#8b9994;font-size:9px}
.operation-metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:9px;margin-bottom:15px}.operation-metrics>div{display:flex;align-items:center;gap:10px;padding:13px 15px;border:1px solid #e5ebe8;border-radius:13px;background:#fff}.operation-metrics>div>svg{color:#7c9a8f;font-size:17px}.operation-metrics span{display:flex;flex-direction:column}.operation-metrics small{color:#9aa49f;font-size:8px}.operation-metrics b{margin-top:2px;color:#38594e;font-size:13px}
.detail-section{margin-bottom:15px;padding:17px;border:1px solid #e4ebe8;border-radius:15px;background:#fff}.section-title{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:14px}.section-title>div{display:flex;flex-direction:column}.section-title b{color:#294c41;font-size:13px}.section-title span{margin-top:3px;color:#93a09b;font-size:9px}.sequence-count{color:#8c9a94;font-size:9px}.material-table :deep(.ant-table-thead>tr>th){padding:10px 12px;background:#f7faf8;font-size:9px}.material-table :deep(.ant-table-tbody>tr>td){padding:10px 12px}.detail-material{display:flex;align-items:center;gap:10px}.material-image,:deep(.material-image img){flex:0 0 44px;border-radius:10px;object-fit:contain;background:#f3f6f5}.material-image.fallback{display:grid;place-items:center;color:#81928b}.detail-material>div:last-child{display:flex;min-width:0;flex-direction:column}.detail-material b{overflow:hidden;color:#435b53;font-size:10px;text-overflow:ellipsis;white-space:nowrap}.detail-material span,.table-secondary{display:block;margin-top:3px;color:#97a29e;font-size:8px}.render-tags{display:flex;gap:3px}.render-tags :deep(.ant-tag){font-size:8px}.material-table td:last-child span,.material-table td:last-child b{display:block}.material-table td:last-child span{color:#8b9893;font-size:8px}.material-table td:last-child b{margin-top:3px;color:#a36d2d}.sequence-scroll{display:flex;gap:8px;padding-bottom:8px;overflow-x:auto}.sequence-item{position:relative;display:flex;align-items:center;flex:0 0 68px;flex-direction:column;padding:8px 5px;border:1px solid #e8eeeb;border-radius:11px;background:#f8faf9}.sequence-item>span{position:absolute;top:4px;left:5px;color:#a4afaa;font:8px Consolas,monospace}.sequence-item :deep(img){border-radius:50%;object-fit:contain}.sequence-item>div{display:grid;place-items:center;width:38px;height:38px;border-radius:50%;color:#82918b;background:#ebf0ee;font-size:10px}.sequence-item small{width:100%;margin-top:5px;overflow:hidden;color:#6e8079;font-size:8px;text-align:center;text-overflow:ellipsis;white-space:nowrap}.live-photo-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.live-photo-grid :deep(.ant-image),.live-photo-grid :deep(img){width:100%!important;aspect-ratio:1;border-radius:11px;object-fit:cover}.review-note{display:flex;align-items:flex-start;gap:10px;margin-bottom:15px;padding:13px 15px;border-radius:12px;color:#9b554f;background:#fff0ee}.review-note>div{display:flex;flex-direction:column}.review-note b{font-size:10px}.review-note span{margin-top:3px;font-size:9px;line-height:1.5}.detail-footer{display:flex;align-items:center;justify-content:space-between;gap:12px}.detail-footer>span{color:#919e99;font-size:9px}.detail-footer>div{display:flex;gap:8px}
.modal-alert{margin-bottom:18px}.review-type-options{display:flex}.review-type-options :deep(.ant-radio-button-wrapper){flex:1;text-align:center}.form-help{display:block;margin-top:8px;color:#929e99;font-size:10px}.photo-modal-summary{display:flex;align-items:flex-start;justify-content:space-between;gap:15px;margin-bottom:14px;padding:12px 14px;border-radius:11px;background:#f5f8f6}.photo-modal-summary>div{display:flex;flex-direction:column}.photo-modal-summary b{color:#36554b;font-size:12px}.photo-modal-summary span,.photo-modal-summary small{margin-top:3px;color:#8f9c97;font-size:9px}.photo-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:18px}.photo-grid>div{position:relative;aspect-ratio:1}.photo-grid>div>span{position:absolute;z-index:2;top:6px;left:6px;display:grid;place-items:center;width:21px;height:21px;border-radius:7px;color:#fff;background:rgba(35,57,50,.72);font-size:9px}.photo-grid :deep(.ant-image),.photo-grid :deep(img){width:100%!important;height:100%!important;border-radius:10px;object-fit:cover}.photo-grid button{position:absolute;z-index:2;right:6px;top:6px;width:27px;height:27px;border:0;border-radius:8px;color:#fff;background:rgba(139,50,45,.88);cursor:pointer}.photo-empty{margin-top:18px}
@media(max-width:1150px){.operation-bar{grid-template-columns:1fr}.type-filter{align-items:flex-start;flex-direction:column}.list-toolbar{align-items:flex-start;flex-direction:column}.detail-hero{grid-template-columns:1fr}.bracelet-stage{min-height:290px}}@media(max-width:760px){.header-search{width:100%}.operation-metrics{grid-template-columns:repeat(2,1fr)}.live-photo-grid,.photo-grid{grid-template-columns:repeat(2,1fr)}.detail-footer>span{display:none}.detail-footer{justify-content:flex-end}.type-filter :deep(.ant-segmented){width:100%}.type-filter :deep(.ant-segmented-group){display:grid;grid-template-columns:repeat(3,1fr)}}
</style>
