<template>
  <div class="page-shell creator-workspace">
    <PageHeader title="设计师管理" description="审核设计师投稿，核对作品结构与珠材使用明细">
      <a-input-search v-model:value="keyword" allow-clear placeholder="作品名 / 设计师 / ID" class="header-search" @search="search" />
      <a-button :loading="loading" @click="refresh"><ReloadOutlined /> 刷新</a-button>
    </PageHeader>

    <section class="review-overview" aria-label="设计师作品概览">
      <button :class="{active:status==='all'}" @click="selectStatus('all')">
        <span class="overview-icon all"><AppstoreOutlined /></span>
        <span><small>全部作品</small><b>{{ overview.all }}</b><em>设计师作品库</em></span>
      </button>
      <button :class="{active:status==='pending'}" @click="selectStatus('pending')">
        <span class="overview-icon pending"><ClockCircleOutlined /></span>
        <span><small>待审核</small><b>{{ overview.pending }}</b><em>需要优先处理</em></span>
      </button>
      <button :class="{active:status==='approved'}" @click="selectStatus('approved')">
        <span class="overview-icon approved"><CheckCircleOutlined /></span>
        <span><small>已上架</small><b>{{ overview.approved }}</b><em>正在灵感广场展示</em></span>
      </button>
      <button :class="{active:status==='rejected'}" @click="selectStatus('rejected')">
        <span class="overview-icon rejected"><StopOutlined /></span>
        <span><small>已下架</small><b>{{ overview.rejected }}</b><em>可查看驳回原因</em></span>
      </button>
    </section>

    <a-card class="surface-card work-list-card" :bordered="false">
      <div class="list-toolbar">
        <div>
          <b>{{ statusLabel }}</b>
          <span>共 {{ total }} 个作品，点击任意作品查看完整珠材构成</span>
        </div>
        <a-segmented v-model:value="status" :options="statusOptions" @change="search" />
      </div>

      <a-table
        row-key="id"
        :columns="columns"
        :data-source="works"
        :loading="loading"
        :pagination="pagination"
        :scroll="{x:1080}"
        :custom-row="workRow"
        row-class-name="work-row"
        @change="onTableChange"
      >
        <template #bodyCell="{column,record}">
          <template v-if="column.key==='work'">
            <div class="work-cell">
              <button class="preview-button" aria-label="查看作品详情" @click.stop="openDetail(record)">
                <BraceletPreview :pattern="record.pattern" :material-map="record.material_map||record.materialMap" :size="82" />
              </button>
              <div>
                <b>{{ record.name||'未命名作品' }}</b>
                <span class="design-code">{{ record.design_code||`#${record.id}` }}</span>
                <small>{{ record.bead_count||0 }} 颗 · {{ record.material_count||materialsOf(record).length }} 种珠材</small>
              </div>
            </div>
          </template>

          <template v-else-if="column.key==='designer'">
            <div class="designer-cell">
              <a-avatar :src="resolveMedia(record.avatar)" :size="38">{{ designerInitial(record) }}</a-avatar>
              <div><b>{{ record.nickname||`用户 ${record.user_id}` }}</b><small>UID {{ record.user_id }}</small></div>
            </div>
          </template>

          <template v-else-if="column.key==='materials'">
            <div class="material-pills">
              <div v-for="material in materialsOf(record).slice(0,3)" :key="material.id">
                <a-image v-if="material.image" :src="resolveMedia(material.image)" :width="26" :height="26" class="pill-image" />
                <span v-else class="pill-fallback">{{ material.name?.slice(0,1)||'珠' }}</span>
                <span>{{ material.name }}</span>
                <b>×{{ material.count }}</b>
              </div>
              <small v-if="materialsOf(record).length>3">还有 {{ materialsOf(record).length-3 }} 种</small>
              <span v-if="!materialsOf(record).length" class="muted">暂无珠材信息</span>
            </div>
          </template>

          <template v-else-if="column.key==='value'">
            <div class="value-cell"><b>{{ money(record.price) }}</b><span>{{ formatNumber(record.perimeter) }} mm</span><small>设计周长</small></div>
          </template>

          <template v-else-if="column.key==='status'">
            <StatusTag :status="record.inspiration_status" :map="designStatusMap" />
            <div class="status-date">{{ dateTime(record.inspiration_submitted_at||record.created_at) }}</div>
          </template>

          <template v-else-if="column.key==='action'">
            <div class="row-action" @click.stop>
              <a-button type="link" @click="openDetail(record)">查看详情 <RightOutlined /></a-button>
            </div>
          </template>
        </template>

        <template #emptyText>
          <a-empty description="当前状态下没有设计师作品" />
        </template>
      </a-table>
    </a-card>

    <a-drawer v-model:open="detailOpen" :width="900" title="设计师作品详情" class="work-detail-drawer">
      <template v-if="selected">
        <section class="detail-hero">
          <div class="bracelet-stage">
            <BraceletPreview :pattern="selected.pattern" :material-map="selected.material_map||selected.materialMap" :size="280" />
          </div>
          <div class="detail-intro">
            <div class="detail-status-line">
              <StatusTag :status="selected.inspiration_status" :map="designStatusMap" />
              <span>{{ selected.design_code||`作品 #${selected.id}` }}</span>
            </div>
            <h2>{{ selected.name||'未命名作品' }}</h2>
            <div class="designer-profile">
              <a-avatar :src="resolveMedia(selected.avatar)" :size="42">{{ designerInitial(selected) }}</a-avatar>
              <div><b>{{ selected.nickname||`用户 ${selected.user_id}` }}</b><span>设计师 UID {{ selected.user_id }}</span></div>
            </div>
            <div class="detail-metrics">
              <div><small>作品售价</small><b>{{ money(selected.price) }}</b></div>
              <div><small>珠子数量</small><b>{{ selected.bead_count||0 }} 颗</b></div>
              <div><small>珠材种类</small><b>{{ materialsOf(selected).length }} 种</b></div>
              <div><small>设计周长</small><b>{{ formatNumber(selected.perimeter) }} mm</b></div>
            </div>
            <div class="detail-time"><ClockCircleOutlined /> 投稿于 {{ dateTime(selected.inspiration_submitted_at||selected.created_at) }}</div>
          </div>
        </section>

        <section class="detail-section">
          <div class="section-title">
            <div><b>珠材清单</b><span>按实际设计用量汇总，便于审核成本与搭配</span></div>
            <a-tag :bordered="false">{{ materialsOf(selected).length }} 种 / {{ selected.bead_count||0 }} 颗</a-tag>
          </div>
          <a-table row-key="id" size="small" :columns="materialColumns" :data-source="materialsOf(selected)" :pagination="false" class="material-table">
            <template #bodyCell="{column,record}">
              <template v-if="column.key==='material'">
                <div class="detail-material">
                  <a-image v-if="record.image" :src="resolveMedia(record.image)" :width="44" :height="44" class="material-image" />
                  <div v-else class="material-image fallback">{{ record.name?.slice(0,1)||'珠' }}</div>
                  <div><b>{{ record.name }}</b><span>{{ record.category||'未分类' }} · {{ record.subcategory||record.color_family||'未设置子分类' }}</span></div>
                </div>
              </template>
              <template v-else-if="column.key==='spec'">
                <b>{{ formatNumber(record.size) }} mm</b><span class="table-secondary">{{ materialTypeLabel(record.type) }}</span>
              </template>
              <template v-else-if="column.key==='render'">
                <div class="render-tags">
                  <a-tag :color="record.stringing_position==='top'?'blue':'default'" :bordered="false">{{ record.stringing_position==='top'?'顶部穿线':'中心穿线' }}</a-tag>
                  <a-tag v-if="record.is_irregular" color="orange" :bordered="false">异形</a-tag>
                </div>
                <span class="table-secondary">占位 {{ positiveNumber(record.stringing_width_mm)||formatNumber(record.size) }} mm</span>
              </template>
              <template v-else-if="column.key==='quantity'"><b>× {{ record.count }}</b></template>
              <template v-else-if="column.key==='amount'"><span>{{ money(record.price) }}</span><b>{{ money(record.subtotal) }}</b></template>
            </template>
            <template #emptyText><a-empty description="作品没有可识别的珠材" /></template>
          </a-table>
        </section>

        <section class="detail-section">
          <div class="section-title">
            <div><b>排列顺序</b><span>从设计数据的第一颗开始依次展示</span></div>
            <span class="sequence-count">{{ patternSequence(selected).length }} 个位置</span>
          </div>
          <div v-if="patternSequence(selected).length" class="sequence-scroll">
            <div v-for="item in patternSequence(selected)" :key="`${item.index}-${item.id}`" class="sequence-item" :title="`${item.name}${item.size ? ` · ${item.size}mm` : ''}`">
              <span>{{ item.index+1 }}</span>
              <a-image v-if="item.image" :src="resolveMedia(item.image)" :width="38" :height="38" :preview="false" />
              <div v-else>{{ item.name?.slice(0,1)||'珠' }}</div>
              <small>{{ item.name }}</small>
              <em>{{ item.size ? `${item.size} mm` : '未标尺寸' }}</em>
            </div>
          </div>
          <a-empty v-else description="暂无排列数据" />
        </section>

        <section v-if="photoList(selected).length" class="detail-section">
          <div class="section-title"><div><b>作品实拍</b><span>设计师提交的成品或细节照片</span></div></div>
          <div class="live-photo-grid"><a-image v-for="photo in photoList(selected)" :key="photo" :src="resolveMedia(photo)" /></div>
        </section>

        <section v-if="selected.inspiration_reject_reason" class="review-note rejected">
          <StopOutlined />
          <div><b>最近一次驳回原因</b><span>{{ selected.inspiration_reject_reason }}</span></div>
        </section>
      </template>

      <template #footer>
        <div class="detail-footer">
          <span>审核前建议核对珠材数量、价格与实拍效果</span>
          <div v-if="selected">
            <a-button v-if="selected.inspiration_status==='pending'" danger @click="openReview('reject')">驳回作品</a-button>
            <a-button v-else-if="selected.inspiration_status==='approved'" danger @click="openReview('reject')">下架作品</a-button>
            <a-button v-if="selected.inspiration_status!=='approved'" type="primary" @click="openReview('approve')">{{ selected.inspiration_status==='rejected'?'重新上架':'通过并上架' }}</a-button>
          </div>
        </div>
      </template>
    </a-drawer>

    <a-modal
      v-model:open="reviewOpen"
      :title="reviewForm.action==='reject'?(selected?.inspiration_status==='approved'?'下架设计师作品':'驳回设计师作品'):'通过设计师作品'"
      :ok-text="reviewForm.action==='reject'?'确认提交':'通过并上架'"
      :ok-button-props="{danger:reviewForm.action==='reject'}"
      :confirm-loading="saving"
      @ok="submitReview"
    >
      <a-alert :type="reviewForm.action==='reject'?'warning':'success'" show-icon class="review-alert" :message="selected?.name||'未命名作品'" />
      <a-form layout="vertical">
        <a-form-item :label="reviewForm.action==='reject'?'驳回 / 下架原因':'审核备注'" :required="reviewForm.action==='reject'">
          <a-textarea v-model:value="reviewForm.reason" :rows="4" maxlength="300" show-count :placeholder="reviewForm.action==='reject'?'请说明具体原因，便于设计师修改':'可填写内部审核备注'" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed,onMounted,reactive,ref } from 'vue'
import { message } from 'ant-design-vue'
import {
  AppstoreOutlined,CheckCircleOutlined,ClockCircleOutlined,
  ReloadOutlined,RightOutlined,StopOutlined,
} from '@ant-design/icons-vue'
import PageHeader from '@/components/PageHeader.vue'
import BraceletPreview from '@/components/BraceletPreview.vue'
import StatusTag from '@/components/StatusTag.vue'
import { errorMessage,get,post } from '@/api/http'
import { dateTime,listFrom,money,resolveMedia,totalFrom } from '@/utils/format'
import {
  designMaterials as materialsOf,
  designPhotos as photoList,
  designSequence as patternSequence,
} from '@/utils/design'

type WorkStatus = 'all'|'pending'|'approved'|'rejected'

const designStatusMap:any={
  pending:{text:'待审核',color:'gold'},
  approved:{text:'已上架',color:'green'},
  rejected:{text:'已下架',color:'red'},
  private:{text:'未发布',color:'default'},
}
const statusOptions=[
  {label:'全部',value:'all'},
  {label:'待审核',value:'pending'},
  {label:'已上架',value:'approved'},
  {label:'已下架',value:'rejected'},
]
const columns=[
  {title:'作品',key:'work',width:280},
  {title:'设计师',key:'designer',width:170},
  {title:'主要珠材',key:'materials',width:240},
  {title:'售价 / 周长',key:'value',width:120},
  {title:'状态 / 投稿时间',key:'status',width:150},
  {title:'操作',key:'action',width:120,fixed:'right' as const},
]
const materialColumns=[
  {title:'珠材',key:'material',width:260},
  {title:'规格',key:'spec',width:100},
  {title:'DIY 配置',key:'render',width:190},
  {title:'数量',key:'quantity',width:80},
  {title:'单价 / 小计',key:'amount',width:130},
]
const materialTypeLabels:Record<string,string>={crystal:'水晶',stone:'石质',glass:'玻璃',wood:'木质',metal:'金属',peishi:'配饰',accessory:'配饰',chenxiang:'沉香'}

const loading=ref(false),saving=ref(false),works=ref<any[]>([]),keyword=ref(''),status=ref<WorkStatus>('all'),page=ref(1),pageSize=ref(20),total=ref(0),selected=ref<any>(),detailOpen=ref(false),reviewOpen=ref(false)
const overview=reactive({all:0,pending:0,approved:0,rejected:0})
const reviewForm=reactive({action:'approve',reason:''})
const pagination=computed(()=>({current:page.value,pageSize:pageSize.value,total:total.value,showSizeChanger:true,showQuickJumper:true,showTotal:(n:number)=>`共 ${n} 个作品`}))
const statusLabel=computed(()=>statusOptions.find(item=>item.value===status.value)?.label||'全部作品')

function designerInitial(record:any){return String(record?.nickname||record?.user_id||'设').slice(0,1)}
function formatNumber(value:unknown){const number=Number(value);return Number.isFinite(number)?Number(number.toFixed(1)).toString():'0'}
function positiveNumber(value:unknown){const number=Number(value);return Number.isFinite(number)&&number>0?formatNumber(number):''}
function materialTypeLabel(value:string){return materialTypeLabels[value]||value||'未设置'}
function workRow(record:any){return{onClick:()=>openDetail(record)}}

async function requestWorks(targetStatus:WorkStatus,pageValue=1,size=pageSize.value){
  return get('/api/admin/design_list',{keyword:keyword.value.trim(),type:'designer',status:targetStatus,page:pageValue,page_size:size})
}
async function load(){
  loading.value=true
  try{
    const data:any=await requestWorks(status.value,page.value)
    works.value=listFrom(data)
    total.value=totalFrom(data,works.value.length)
  }catch(e){message.error(errorMessage(e))}finally{loading.value=false}
}
async function loadOverview(){
  try{
    const [all,pending,approved,rejected]=await Promise.all([
      requestWorks('all',1,1),requestWorks('pending',1,1),requestWorks('approved',1,1),requestWorks('rejected',1,1),
    ])
    overview.all=totalFrom(all,0)
    overview.pending=totalFrom(pending,0)
    overview.approved=totalFrom(approved,0)
    overview.rejected=totalFrom(rejected,0)
  }catch{ /* 主列表会展示可见错误，概览失败不重复提示 */ }
}
function search(){page.value=1;void load()}
function refresh(){void Promise.all([load(),loadOverview()])}
function selectStatus(value:WorkStatus){status.value=value;page.value=1;void load()}
function onTableChange(p:any){page.value=p.current;pageSize.value=p.pageSize;void load()}
function openDetail(row:any){selected.value=row;detailOpen.value=true}
function openReview(action:string){reviewForm.action=action;reviewForm.reason='';reviewOpen.value=true}
async function submitReview(){
  if(reviewForm.action==='reject'&&!reviewForm.reason.trim())return message.warning('请填写驳回或下架原因')
  saving.value=true
  try{
    await post('/api/admin/design_review',{id:selected.value.id,action:reviewForm.action,type:'designer',reason:reviewForm.reason.trim()})
    message.success(reviewForm.action==='reject'?'作品已下架':'作品已通过并上架')
    reviewOpen.value=false
    detailOpen.value=false
    await Promise.all([load(),loadOverview()])
  }catch(e){message.error(errorMessage(e))}finally{saving.value=false}
}

onMounted(()=>{void Promise.all([load(),loadOverview()])})
</script>

<style scoped>
.creator-workspace{--creator-green:#246b58;--creator-line:#e4ebe8}.header-search{width:260px}.review-overview{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.review-overview button{display:flex;align-items:center;gap:13px;padding:17px;border:1px solid rgba(31,106,86,.08);border-radius:15px;background:#fff;box-shadow:0 8px 24px rgba(24,62,52,.04);cursor:pointer;text-align:left;transition:.18s ease}.review-overview button:hover,.review-overview button.active{border-color:rgba(31,106,86,.3);box-shadow:0 10px 28px rgba(24,62,52,.09);transform:translateY(-1px)}.review-overview button.active{background:linear-gradient(135deg,#fff,#f2f8f5)}.review-overview button>span:last-child{display:flex;min-width:0;flex-direction:column}.review-overview small{color:#7e8d87;font-size:11px}.review-overview b{margin:2px 0;color:#24463c;font-size:25px;line-height:1.15}.review-overview em{overflow:hidden;color:#9da8a4;font-size:10px;font-style:normal;text-overflow:ellipsis;white-space:nowrap}.overview-icon{display:grid;place-items:center;flex:0 0 40px;height:40px;border-radius:12px;font-size:18px}.overview-icon.all{color:#276b58;background:#e8f3ef}.overview-icon.pending{color:#a46d28;background:#fff2df}.overview-icon.approved{color:#31755e;background:#e5f3eb}.overview-icon.rejected{color:#ad5a52;background:#fff0ee}
.work-list-card{overflow:hidden;border-radius:16px!important}.work-list-card :deep(.ant-card-body){padding:0}.list-toolbar{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:17px 20px;border-bottom:1px solid var(--creator-line)}.list-toolbar>div{display:flex;flex-direction:column}.list-toolbar b{color:#294b40;font-size:15px}.list-toolbar span{margin-top:3px;color:#899790;font-size:11px}.work-list-card :deep(.ant-table-thead>tr>th){padding:13px 16px;color:#6d7d77;background:#f8faf9;font-size:12px}.work-list-card :deep(.ant-table-tbody>tr>td){padding:14px 16px;border-bottom-color:#edf1ef}.work-list-card :deep(.work-row){cursor:pointer}.work-list-card :deep(.work-row:hover>td){background:#f7fbf9!important}.work-list-card :deep(.ant-pagination){margin:18px 20px}
.work-cell{display:flex;align-items:center;gap:13px}.preview-button{padding:0;border:1px solid #e2eae6;border-radius:50%;background:#f7faf8;cursor:pointer}.work-cell>div:last-child{display:flex;min-width:0;flex-direction:column}.work-cell b{overflow:hidden;color:#29463d;text-overflow:ellipsis;white-space:nowrap}.design-code{margin-top:3px;color:#889690;font-family:Consolas,monospace;font-size:10px}.work-cell small{margin-top:3px;color:#a0aaa6;font-size:10px}.designer-cell{display:flex;align-items:center;gap:9px}.designer-cell>div{display:flex;min-width:0;flex-direction:column}.designer-cell b{overflow:hidden;color:#455c54;font-size:12px;text-overflow:ellipsis;white-space:nowrap}.designer-cell small{margin-top:3px;color:#9ba6a2;font-size:10px}.material-pills{display:flex;flex-direction:column;gap:5px}.material-pills>div{display:flex;align-items:center;gap:6px;min-width:0}.pill-image,:deep(.pill-image img){border-radius:7px;object-fit:contain;background:#f3f6f5}.pill-fallback{display:grid;place-items:center;width:26px;height:26px;border-radius:7px;color:#87968f;background:#edf2ef;font-size:10px}.material-pills>div>span:not(.pill-fallback){overflow:hidden;flex:1;color:#586c64;font-size:10px;text-overflow:ellipsis;white-space:nowrap}.material-pills>div>b{color:#916b36;font-size:10px}.material-pills>small{color:#9ba6a2;font-size:9px}.value-cell{display:flex;flex-direction:column}.value-cell b{color:#ac722d}.value-cell span{margin-top:4px;color:#566b63;font-size:11px}.value-cell small{color:#a1aba7;font-size:9px}.status-date{margin-top:6px;color:#8f9b96;font-size:9px}.row-action{text-align:right}
.detail-hero{display:grid;grid-template-columns:310px 1fr;gap:24px;margin:-8px 0 18px;padding:18px;border:1px solid #e1ebe6;border-radius:18px;background:linear-gradient(135deg,#f6faf8,#edf5f1)}.bracelet-stage{display:grid;place-items:center;min-height:300px;border-radius:15px;background:rgba(255,255,255,.72)}.detail-intro{display:flex;justify-content:center;flex-direction:column}.detail-status-line{display:flex;align-items:center;gap:9px}.detail-status-line>span{color:#899791;font-family:Consolas,monospace;font-size:10px}.detail-intro h2{margin:12px 0 14px;color:#204a3d;font:700 26px Georgia,'Noto Serif SC',serif}.designer-profile{display:flex;align-items:center;gap:10px}.designer-profile>div{display:flex;flex-direction:column}.designer-profile b{color:#405b52;font-size:12px}.designer-profile span{margin-top:3px;color:#97a29e;font-size:10px}.detail-metrics{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-top:18px}.detail-metrics>div{display:flex;flex-direction:column;padding:10px;border-radius:10px;background:rgba(255,255,255,.72)}.detail-metrics small{color:#91a09a;font-size:9px}.detail-metrics b{margin-top:3px;color:#2e5f50;font-size:15px}.detail-time{margin-top:14px;color:#8b9994;font-size:10px}
.detail-section{margin-bottom:16px;padding:17px;border:1px solid #e6ece9;border-radius:15px;background:#fff}.section-title{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:15px}.section-title>div{display:flex;flex-direction:column}.section-title b{color:#294c41;font-size:14px}.section-title span{margin-top:3px;color:#93a09b;font-size:10px}.material-table :deep(.ant-table-thead>tr>th){padding:10px 12px;background:#f7faf8;font-size:10px}.material-table :deep(.ant-table-tbody>tr>td){padding:10px 12px}.detail-material{display:flex;align-items:center;gap:10px}.material-image,:deep(.material-image img){flex:0 0 44px;border-radius:10px;object-fit:contain;background:#f3f6f5}.material-image.fallback{display:grid;place-items:center;color:#81928b}.detail-material>div:last-child{display:flex;min-width:0;flex-direction:column}.detail-material b{overflow:hidden;color:#435b53;font-size:11px;text-overflow:ellipsis;white-space:nowrap}.detail-material span,.table-secondary{display:block;margin-top:3px;color:#97a29e;font-size:9px}.render-tags{display:flex;gap:3px}.render-tags :deep(.ant-tag){font-size:9px}.material-table td:last-child span,.material-table td:last-child b{display:block}.material-table td:last-child span{color:#8b9893;font-size:9px}.material-table td:last-child b{margin-top:3px;color:#a36d2d}.sequence-count{color:#8c9a94;font-size:10px}.sequence-scroll{display:flex;gap:8px;padding-bottom:8px;overflow-x:auto}.sequence-item{position:relative;display:flex;align-items:center;flex:0 0 74px;flex-direction:column;padding:8px 5px;border:1px solid #e8eeeb;border-radius:11px;background:#f8faf9}.sequence-item>span{position:absolute;top:4px;left:5px;color:#a4afaa;font:8px Consolas,monospace}.sequence-item :deep(img){border-radius:50%;object-fit:contain}.sequence-item>div{display:grid;place-items:center;width:38px;height:38px;border-radius:50%;color:#82918b;background:#ebf0ee;font-size:10px}.sequence-item small{width:100%;margin-top:5px;overflow:hidden;color:#6e8079;font-size:8px;text-align:center;text-overflow:ellipsis;white-space:nowrap}.sequence-item em{margin-top:2px;color:#a16f36;font-size:8px;font-style:normal;font-weight:700;white-space:nowrap}.live-photo-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.live-photo-grid :deep(.ant-image),.live-photo-grid :deep(img){width:100%!important;aspect-ratio:1;border-radius:11px;object-fit:cover}.review-note{display:flex;align-items:flex-start;gap:10px;margin-bottom:16px;padding:13px 15px;border-radius:12px}.review-note.rejected{color:#9b554f;background:#fff0ee}.review-note>div{display:flex;flex-direction:column}.review-note b{font-size:11px}.review-note span{margin-top:3px;font-size:10px;line-height:1.5}.detail-footer{display:flex;align-items:center;justify-content:space-between;gap:12px}.detail-footer>span{color:#919e99;font-size:10px}.detail-footer>div{display:flex;gap:8px}.review-alert{margin-bottom:18px}
@media(max-width:1100px){.review-overview{grid-template-columns:repeat(2,1fr)}.list-toolbar{align-items:flex-start;flex-direction:column}.detail-hero{grid-template-columns:1fr}.bracelet-stage{min-height:280px}}
@media(max-width:720px){.header-search{width:100%}.review-overview{grid-template-columns:1fr 1fr}.review-overview em{display:none}.detail-metrics{grid-template-columns:1fr 1fr}.live-photo-grid{grid-template-columns:repeat(2,1fr)}.detail-footer>span{display:none}.detail-footer{justify-content:flex-end}}
</style>
