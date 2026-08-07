<template>
  <div class="page-shell bead-catalog">
    <PageHeader title="盘珠管理" description="统一维护珠材商品资料、图片素材与 DIY 渲染参数">
      <a-button @click="openCategorySettings"><ApartmentOutlined /> 分类设置</a-button>
      <a-button type="primary" @click="openCreate"><PlusOutlined /> 新增盘珠</a-button>
    </PageHeader>

    <section class="catalog-stats" aria-label="珠材概览">
      <button :class="{active:renderFilter===''}" @click="applyQuickFilter('')">
        <span class="stat-icon green"><AppstoreOutlined /></span>
        <span><small>全部珠材</small><b>{{ beads.length }}</b><em>当前目录总量</em></span>
      </button>
      <button :class="{active:renderFilter==='irregular'}" @click="applyQuickFilter('irregular')">
        <span class="stat-icon amber"><BgColorsOutlined /></span>
        <span><small>异形材质</small><b>{{ overview.irregular }}</b><em>需要重点检查渲染</em></span>
      </button>
      <button :class="{active:renderFilter==='top'}" @click="applyQuickFilter('top')">
        <span class="stat-icon blue"><AimOutlined /></span>
        <span><small>顶部穿线</small><b>{{ overview.top }}</b><em>使用穿线占位宽度</em></span>
      </button>
      <button :class="{active:renderFilter==='canvas'}" @click="applyQuickFilter('canvas')">
        <span class="stat-icon violet"><PictureOutlined /></span>
        <span><small>独立 Canvas 图</small><b>{{ overview.canvas }}</b><em>展示图与渲染图分离</em></span>
      </button>
      <button :class="{active:renderFilter==='issues'}" @click="applyQuickFilter('issues')">
        <span class="stat-icon red"><WarningOutlined /></span>
        <span><small>待完善</small><b>{{ overview.issues }}</b><em>缺图片或穿线参数</em></span>
      </button>
    </section>

    <a-card class="filter-card" :bordered="false">
      <div class="filter-main">
        <a-input v-model:value="keyword" allow-clear placeholder="搜索名称、英文名或 ID" class="keyword-input">
          <template #prefix><SearchOutlined /></template>
        </a-input>
        <a-select v-model:value="subcategoryFilter" allow-clear placeholder="子分类 / 色系" :options="subcategoryFilterOptions" class="filter-select" />
        <a-select v-model:value="materialFilter" allow-clear placeholder="材质类型" :options="materialOptions" class="filter-select" />
        <a-select v-model:value="renderFilter" allow-clear placeholder="渲染状态" :options="renderFilterOptions" class="filter-select" />
        <a-button :disabled="!hasActiveFilters" @click="resetFilters"><ReloadOutlined /> 重置</a-button>
      </div>
      <div class="category-tabs">
        <button :class="{active:activeCategory===''}" @click="selectCategory('')">全部 <span>{{ beads.length }}</span></button>
        <button v-for="cat in categories" :key="cat.id" :class="{active:activeCategory===cat.label}" @click="selectCategory(cat.label)">{{ cat.label }} <span>{{ countByCategory(cat.label) }}</span></button>
      </div>
      <div class="filter-result">
        <span>当前结果 <b>{{ filtered.length }}</b> 条</span>
        <span v-if="hasActiveFilters" class="filter-hint">已应用筛选条件</span>
      </div>
    </a-card>

    <a-card class="surface-card catalog-table-card" :bordered="false">
      <a-table
        row-key="id"
        :columns="columns"
        :data-source="filtered"
        :loading="loading"
        :scroll="{x:1040}"
        :row-class-name="(row:any)=>hasDataIssue(row)?'data-issue-row':''"
        :pagination="{pageSize:30,showSizeChanger:true,pageSizeOptions:['20','30','50','100'],showQuickJumper:true,showTotal:(n:number)=>`共 ${n} 种珠材`}"
      >
        <template #bodyCell="{column,record}">
          <template v-if="column.key==='bead'">
            <div class="material-cell">
              <div class="material-thumb-wrap">
                <a-image v-if="record.image" :src="resolveMedia(record.image)" :width="54" :height="54" class="bead-image" />
                <div v-else class="empty-thumb"><PictureOutlined /></div>
                <span v-if="hasDataIssue(record)" class="issue-dot" title="资料待完善"></span>
              </div>
              <div class="material-copy">
                <div class="material-name">{{ record.name||'未命名珠材' }}</div>
                <div class="material-en">{{ record.name_en||'暂无英文名' }}</div>
                <div class="material-id">ID {{ record.id }}</div>
              </div>
            </div>
          </template>

          <template v-else-if="column.key==='category'">
            <div class="category-cell">
              <a-tag color="green" :bordered="false">{{ record.category||'未分类' }}</a-tag>
              <span>{{ record.subcategory||record.color_family||'未设置子分类' }}</span>
            </div>
          </template>

          <template v-else-if="column.key==='commerce'">
            <div class="commerce-cell">
              <div><b>{{ materialLabels[record.type]||record.type||'未设置' }}</b><span>{{ variantSizeText(record) }}</span></div>
              <strong>{{ priceRangeText(record) }}</strong>
              <small>素材排序 {{ record.category_sort_order ?? 100 }}</small>
            </div>
          </template>

          <template v-else-if="column.key==='stringing'">
            <div class="config-cell">
              <div class="config-tags">
                <a-tag :color="record.stringing_position==='top'?'blue':'default'" :bordered="false">{{ record.stringing_position==='top'?'顶部穿线':'中心穿线' }}</a-tag>
                <a-tag v-if="booleanValue(record.is_irregular)" color="orange" :bordered="false">异形</a-tag>
              </div>
              <div><span>占位宽度</span><b>{{ positiveNumber(record.stringing_width_mm) ? `${formatNumber(record.stringing_width_mm)} mm` : '跟随所选尺寸' }}</b></div>
              <div><span>穿线偏移</span><b>{{ signedNumber(record.stringing_offset_mm) }} mm</b></div>
            </div>
          </template>

          <template v-else-if="column.key==='render'">
            <div class="render-cell">
              <div class="render-image-status">
                <a-image v-if="record.canvas_image" :src="resolveMedia(record.canvas_image)" :width="34" :height="34" class="canvas-image" />
                <span v-else class="fallback-canvas"><PictureOutlined /></span>
                <div><b>{{ record.canvas_image?'独立 Canvas 图':'沿用展示图' }}</b><small>{{ record.canvas_image?'已配置渲染素材':'无需重复上传' }}</small></div>
              </div>
              <div class="render-meta"><span>缩放 ×{{ positiveNumber(record.image_scale)||1 }}</span><span>层级 {{ layerText(record) }}</span></div>
            </div>
          </template>

          <template v-else-if="column.key==='action'">
            <div class="row-actions">
              <a-tooltip title="编辑珠材"><a-button type="text" class="edit-button" @click="openEdit(record)"><EditOutlined /></a-button></a-tooltip>
              <a-dropdown placement="bottomRight">
                <a-button type="text"><MoreOutlined /></a-button>
                <template #overlay>
                  <a-menu>
                    <a-menu-item key="delete" danger @click="remove(record)"><DeleteOutlined /> 删除珠材</a-menu-item>
                  </a-menu>
                </template>
              </a-dropdown>
            </div>
          </template>
        </template>
        <template #emptyText>
          <a-empty description="没有符合条件的珠材">
            <a-button v-if="hasActiveFilters" @click="resetFilters">清除筛选</a-button>
          </a-empty>
        </template>
      </a-table>
    </a-card>

    <a-drawer v-model:open="editorOpen" :title="form.id?'编辑珠材':'新增珠材'" :width="760" class="bead-editor">
      <a-form ref="formRef" layout="vertical" :model="form" :rules="rules">
        <div class="editor-hero">
          <a-image v-if="form.image" :src="resolveMedia(form.image)" :width="72" :height="72" class="editor-image" />
          <div v-else class="editor-image empty"><PictureOutlined /></div>
          <div class="editor-identity">
            <small>{{ form.id ? `珠材 ID ${form.id}` : '新建珠材' }}</small>
            <b>{{ form.name||'未命名珠材' }}</b>
            <span>{{ form.category||'未分类' }} · {{ variantSizeText(form) }} · {{ priceRangeText(form) }}</span>
          </div>
          <div class="editor-badges">
            <a-tag v-if="form.is_irregular" color="orange" :bordered="false">异形</a-tag>
            <a-tag :color="form.stringing_position==='top'?'blue':'default'" :bordered="false">{{ form.stringing_position==='top'?'顶部穿线':'中心穿线' }}</a-tag>
          </div>
        </div>

        <a-tabs v-model:active-key="editorTab" class="editor-tabs">
          <a-tab-pane key="base" tab="基础资料">
            <section class="editor-section">
              <div class="section-heading"><div><b>商品信息</b><span>用于后台检索和小程序展示</span></div></div>
              <div class="form-grid">
                <a-form-item label="中文名称" name="name"><a-input v-model:value="form.name" placeholder="例如：锆石蝴蝶吊坠" /></a-form-item>
                <a-form-item label="英文名称"><a-input v-model:value="form.name_en" placeholder="留空将自动翻译" /></a-form-item>
                <a-form-item label="繁体名称"><a-input v-model:value="form.name_zh_tw" placeholder="留空将自动转换" /></a-form-item>
                <a-form-item label="素材排序"><a-input-number v-model:value="form.category_sort_order" :min="1" style="width:100%" /></a-form-item>
                <a-form-item label="主分类" name="category"><a-select v-model:value="form.category" :options="categories.map(x=>({label:x.label,value:x.label}))" @change="categoryChanged" /></a-form-item>
                <a-form-item :label="isAccessory?'配饰子分类':'色系'" :name="isAccessory?'subcategory':'color_family'">
                  <a-select v-if="currentSubcategories.length" :value="isAccessory?form.subcategory:form.color_family" :options="currentSubcategories.map(x=>({label:x.label,value:x.label}))" @change="subChanged" />
                  <a-input v-else :value="isAccessory?form.subcategory:form.color_family" @update:value="subChanged" />
                </a-form-item>
                <a-form-item label="材质类型" name="type"><a-select v-model:value="form.type" :options="materialOptions" /></a-form-item>
                <a-form-item label="异形材质">
                  <div class="switch-row"><a-switch v-model:checked="form.is_irregular" checked-children="是" un-checked-children="否" @change="handleIrregularChange" /><span>{{ form.is_irregular?'异形材质仅允许一个尺寸':'普通珠材可设置多个尺寸' }}</span></div>
                </a-form-item>
                <div class="span-2 variant-editor">
                  <div class="variant-editor__head">
                    <div><b>尺寸与价格</b><span>{{ form.is_irregular?'异形材质只维护一条规格':'一个珠材可维护多个尺寸，无需重复上传图片' }}</span></div>
                    <a-button v-if="!form.is_irregular" size="small" @click="addVariant"><PlusOutlined /> 添加尺寸</a-button>
                  </div>
                  <div class="variant-editor__columns"><span>尺寸（mm）</span><span>销售价格</span><span></span></div>
                  <div v-for="(variant,index) in form.variants" :key="variant.id||`new_${index}`" class="variant-row">
                    <a-input-number v-model:value="variant.size" :min="0.1" :step="0.1" style="width:100%" />
                    <a-input-number v-model:value="variant.price" :min="0" :precision="2" prefix="¥" style="width:100%" />
                    <a-button v-if="!form.is_irregular&&form.variants.length>1" type="text" danger aria-label="删除尺寸" @click="removeVariant(index)"><DeleteOutlined /></a-button>
                  </div>
                </div>
                <a-form-item class="span-2" label="珠材描述"><a-textarea v-model:value="form.description" :rows="4" maxlength="500" show-count placeholder="补充材质、工艺或搭配建议" /></a-form-item>
              </div>
            </section>
          </a-tab-pane>

          <a-tab-pane key="media" tab="图片素材">
            <section class="editor-section">
              <div class="section-heading"><div><b>展示图片</b><span>用于列表、详情和素材选择器</span></div><a-tag color="green" :bordered="false">建议正面图</a-tag></div>
              <ImageUploader v-model="form.image" />
            </section>
            <section class="editor-section">
              <div class="section-heading"><div><b>Canvas 渲染图片</b><span>仅在实际串珠角度与展示图不同时配置</span></div><a-tag :color="form.canvas_image?'blue':'default'" :bordered="false">{{ form.canvas_image?'已独立配置':'沿用展示图' }}</a-tag></div>
              <div class="media-explainer">
                <PictureOutlined />
                <span><b>什么时候需要？</b><small>例如跑环展示时用正面图，但串到手串上需要侧面图。留空不会影响普通珠材。</small></span>
              </div>
              <ImageUploader v-model="form.canvas_image" />
              <div v-if="form.canvas_image" class="image-actions"><a-button type="link" size="small" danger @click="form.canvas_image=''">清空并沿用展示图</a-button></div>
            </section>
          </a-tab-pane>

          <a-tab-pane key="render" tab="DIY 渲染">
            <div class="render-summary">
              <div><small>有效占位宽度</small><b>{{ effectiveStringingWidth }} mm</b><span>{{ form.stringing_width_mm?'使用自定义值':'当前沿用 size' }}</span></div>
              <div><small>穿线位置</small><b>{{ form.stringing_position==='top'?'顶部':'中心' }}</b><span>图片头部始终朝向圆心</span></div>
              <div><small>有效层级</small><b>{{ effectiveLayer }}</b><span>{{ form.layer===null?'自动计算':'使用自定义值' }}</span></div>
            </div>
            <section class="editor-section">
              <div class="section-heading"><div><b>穿线与碰撞</b><span>控制材质在手串圆环中的实际占位</span></div></div>
              <div class="form-grid">
                <a-form-item label="穿线位置">
                  <a-select v-model:value="form.stringing_position" :options="stringingPositionOptions" />
                </a-form-item>
                <a-form-item label="穿线占位宽度（mm）">
                  <a-input-number v-model:value="form.stringing_width_mm" :min="0.1" :step="0.1" placeholder="留空时沿用珠子尺寸" style="width:100%" />
                  <div class="field-help">留空时周长和占位继续使用 size。</div>
                </a-form-item>
                <a-form-item label="穿线偏移（mm）">
                  <a-input-number v-model:value="form.stringing_offset_mm" :step="0.1" style="width:100%" />
                  <div class="field-help">支持正负数，用于向中心或外侧微调。</div>
                </a-form-item>
                <a-form-item label="Canvas 图片缩放">
                  <a-input-number v-model:value="form.image_scale" :min="0.01" :step="0.05" style="width:100%" />
                </a-form-item>
              </div>
            </section>
            <section class="editor-section">
              <div class="section-heading"><div><b>渲染层级</b><span>异形素材默认使用更高渲染层级</span></div></div>
              <div class="form-grid">
                <a-form-item label="渲染层级">
                  <a-input-number v-model:value="form.layer" :step="1" placeholder="留空时自动计算" style="width:100%" />
                  <div class="field-help">拖动中的材质仍由小程序临时置顶。</div>
                </a-form-item>
              </div>
            </section>
          </a-tab-pane>
        </a-tabs>
      </a-form>
      <template #footer>
        <div class="drawer-footer">
          <span>修改保存后会直接影响小程序 DIY 素材</span>
          <div><a-button @click="editorOpen=false">取消</a-button><a-button type="primary" :loading="saving" @click="save">保存珠材</a-button></div>
        </div>
      </template>
    </a-drawer>

    <a-modal v-model:open="categoryOpen" title="盘珠分类设置" :width="820" :footer="null" @cancel="resetCategoryDrafts">
      <div class="config-intro"><SettingOutlined /><span><b>这里是小程序素材分类的唯一排序来源</b><small>修改名称会同步已有素材；仍有素材使用的分类不能删除。</small></span></div>
      <a-tabs v-model:active-key="categoryTab">
        <a-tab-pane key="main" tab="主分类">
          <div class="config-column-head"><span>顺序</span><span>显示名称</span><span>唯一编码</span><span>操作</span></div>
          <div class="category-editor">
            <div
              v-for="(cat,index) in categories"
              :key="cat.id"
              class="category-row"
              :class="{dragging:draggingCategory===index}"
              draggable="true"
              @dragstart="startCategoryDrag(index,$event)"
              @dragover.prevent
              @drop="dropCategory(index)"
              @dragend="draggingCategory=null"
            >
              <div class="sort-handle"><HolderOutlined /><b>{{ index+1 }}</b></div>
              <div class="config-field"><a-input v-model:value="cat.label"/><small>{{ countByCategory(cat.label) }} 个素材</small></div>
              <a-input v-model:value="cat.id" disabled/>
              <a-button :disabled="index===0" @click="moveCategory(index,-1)"><ArrowUpOutlined/></a-button>
              <a-button :disabled="index===categories.length-1" @click="moveCategory(index,1)"><ArrowDownOutlined/></a-button>
              <a-button danger @click="deleteCategory(index)"><DeleteOutlined/></a-button>
            </div>
          </div>
          <div class="config-actions"><a-button @click="addCategory"><PlusOutlined/> 新增分类</a-button><a-button type="primary" :loading="savingConfig" @click="saveCategories">保存主分类</a-button></div>
        </a-tab-pane>
        <a-tab-pane key="sub" tab="子分类 / 色系">
          <a-segmented v-model:value="activeSubId" :options="categories.map(x=>({label:x.label,value:x.id}))" block />
          <div class="subcategory-tip">
            <b>{{ categories.find(item=>item.id===activeSubId)?.label||'当前分类' }}</b>
            <span>小程序左侧筛选将严格按照以下顺序和完整名称显示。</span>
          </div>
          <div class="config-column-head sub-head"><span>顺序</span><span>显示名称</span><span>唯一编码</span><span>操作</span></div>
          <div class="category-editor sub-editor">
            <div
              v-for="(sub,index) in currentConfigSubs"
              :key="`${sub.id}-${index}`"
              class="category-row"
              :class="{dragging:draggingSub===index}"
              draggable="true"
              @dragstart="startSubDrag(index,$event)"
              @dragover.prevent
              @drop="dropSub(index)"
              @dragend="draggingSub=null"
            >
              <div class="sort-handle"><HolderOutlined /><b>{{ index+1 }}</b></div>
              <div class="config-field"><a-input v-model:value="sub.label" placeholder="显示名称"/><small>{{ countBySubcategory(activeSubId,sub.label) }} 个素材</small></div>
              <a-input v-model:value="sub.id" placeholder="唯一编码"/>
              <a-button :disabled="index===0" @click="moveSub(index,-1)"><ArrowUpOutlined/></a-button>
              <a-button :disabled="index===currentConfigSubs.length-1" @click="moveSub(index,1)"><ArrowDownOutlined/></a-button>
              <a-button danger @click="deleteSub(index)"><DeleteOutlined/></a-button>
            </div>
          </div>
          <div class="config-actions"><a-button @click="addSub"><PlusOutlined/> 新增{{ activeSubId==='peishi'?'子分类':'色系' }}</a-button><a-button type="primary" :loading="savingConfig" @click="saveSubcategories">保存配置</a-button></div>
        </a-tab-pane>
      </a-tabs>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed,onMounted,reactive,ref } from 'vue'
import { message,Modal,type FormInstance } from 'ant-design-vue'
import {
  AimOutlined,ApartmentOutlined,AppstoreOutlined,ArrowDownOutlined,ArrowUpOutlined,
  BgColorsOutlined,DeleteOutlined,EditOutlined,HolderOutlined,MoreOutlined,
  PictureOutlined,PlusOutlined,ReloadOutlined,SearchOutlined,SettingOutlined,WarningOutlined,
} from '@ant-design/icons-vue'
import PageHeader from '@/components/PageHeader.vue'
import ImageUploader from '@/components/ImageUploader.vue'
import { errorMessage,get,post } from '@/api/http'
import { listFrom,money,resolveMedia } from '@/utils/format'

interface Category { id:string; label:string }
interface BeadVariantForm { id:number|null; size:number; price:number }
type RenderFilter = ''|'irregular'|'top'|'canvas'|'issues'

const defaults:Category[]=[{id:'crystal',label:'水晶'},{id:'chxiang',label:'沉香'},{id:'puti',label:'菩提'},{id:'wenwan',label:'文玩'},{id:'peishi',label:'配饰'}]
const loading=ref(false),saving=ref(false),savingConfig=ref(false),beads=ref<any[]>([]),keyword=ref(''),activeCategory=ref(''),subcategoryFilter=ref<string|undefined>(),materialFilter=ref<string|undefined>(),renderFilter=ref<RenderFilter>(''),editorOpen=ref(false),categoryOpen=ref(false),categoryTab=ref('main'),editorTab=ref('base'),formRef=ref<FormInstance>()
const categories=ref<Category[]>(structuredClone(defaults)),subcategories=ref<Record<string,Category[]>>({}),activeSubId=ref('crystal')
const savedCategories=ref<Category[]>(structuredClone(defaults)),savedSubcategories=ref<Record<string,Category[]>>({})
const draggingCategory=ref<number|null>(null),draggingSub=ref<number|null>(null)
const materialLabels:Record<string,string>={wood:'木质',stone:'石质',glass:'玻璃',metal:'金属',crystal:'水晶',peishi:'配饰',accessory:'配饰',chenxiang:'沉香'}
const materialOptions=Object.entries(materialLabels).map(([value,label])=>({value,label}))
const stringingPositionOptions=[{label:'中心穿线',value:'center'},{label:'顶部穿线',value:'top'}]
const renderFilterOptions=[{label:'全部渲染状态',value:''},{label:'异形材质',value:'irregular'},{label:'顶部穿线',value:'top'},{label:'已配置独立 Canvas 图',value:'canvas'},{label:'资料待完善',value:'issues'}]
const emptyForm=()=>({id:'',name:'',name_en:'',name_zh_tw:'',category:'水晶',subcategory:'',category_sort_order:100,color_family:'',type:'stone',variants:[{id:null,size:8,price:0}] as BeadVariantForm[],image:'',canvas_image:'',stringing_width_mm:null as number|null,stringing_position:'center' as 'center'|'top',stringing_offset_mm:0,image_scale:1,is_irregular:false,layer:null as number|null,description:''})
const form=reactive(emptyForm())
const rules={name:[{required:true,message:'请输入中文名称'}],category:[{required:true,message:'请选择主分类'}],type:[{required:true,message:'请选择材质'}]}
const columns=[
  {title:'珠材信息',key:'bead',width:250},
  {title:'分类',key:'category',width:130},
  {title:'商品规格',key:'commerce',width:180,sorter:(a:any,b:any)=>primarySize(a)-primarySize(b)},
  {title:'穿线参数',key:'stringing',width:210},
  {title:'渲染素材',key:'render',width:210},
  {title:'操作',key:'action',width:90,fixed:'right' as const},
]

const selectedCategory=computed(()=>categories.value.find(x=>x.label===form.category))
const isAccessory=computed(()=>selectedCategory.value?.id==='peishi'||form.category==='配饰')
const currentSubcategories=computed(()=>subcategories.value[selectedCategory.value?.id||'']||[])
const currentConfigSubs=computed(()=>subcategories.value[activeSubId.value]||(subcategories.value[activeSubId.value]=[]))
const hasActiveFilters=computed(()=>Boolean(keyword.value.trim()||activeCategory.value||subcategoryFilter.value||materialFilter.value||renderFilter.value))
const effectiveStringingWidth=computed(()=>formatNumber(positiveNumber(form.stringing_width_mm)||primarySize(form)))
const effectiveLayer=computed(()=>form.layer===null||form.layer===undefined ? (form.is_irregular?25:20) : formatNumber(form.layer))

const overview=computed(()=>({
  irregular:beads.value.filter(item=>booleanValue(item.is_irregular)).length,
  top:beads.value.filter(item=>item.stringing_position==='top').length,
  canvas:beads.value.filter(item=>String(item.canvas_image||'').trim()).length,
  issues:beads.value.filter(hasDataIssue).length,
}))

const subcategoryFilterOptions=computed(()=>{
  const source=activeCategory.value?beads.value.filter(item=>item.category===activeCategory.value):beads.value
  return Array.from(new Set(source.map(item=>String(item.subcategory||item.color_family||'').trim()).filter(Boolean)))
    .sort((a,b)=>a.localeCompare(b,'zh-CN'))
    .map(value=>({label:value,value}))
})

const filtered=computed(()=>beads.value.filter(item=>{
  const query=keyword.value.trim().toLowerCase()
  if(activeCategory.value&&item.category!==activeCategory.value)return false
  if(subcategoryFilter.value&&item.subcategory!==subcategoryFilter.value&&item.color_family!==subcategoryFilter.value)return false
  if(materialFilter.value&&item.type!==materialFilter.value)return false
  if(query&&![item.id,item.name,item.name_en,item.name_zh_tw,item.category,item.subcategory,item.color_family].some(value=>String(value||'').toLowerCase().includes(query)))return false
  if(renderFilter.value==='irregular'&&!booleanValue(item.is_irregular))return false
  if(renderFilter.value==='top'&&item.stringing_position!=='top')return false
  if(renderFilter.value==='canvas'&&!String(item.canvas_image||'').trim())return false
  if(renderFilter.value==='issues'&&!hasDataIssue(item))return false
  return true
}))

function finiteNumber(value:unknown,fallback:number){const number=Number(value);return Number.isFinite(number)?number:fallback}
function positiveNumber(value:unknown){const number=finiteNumber(value,0);return number>0?number:null}
function booleanValue(value:unknown){return value===true||value===1||String(value).toLowerCase()==='true'}
function formatNumber(value:unknown){return Number(finiteNumber(value,0).toFixed(2)).toString()}
function variantsOf(value:any):BeadVariantForm[]{return Array.isArray(value?.variants)?value.variants:[]}
function primarySize(value:any){return finiteNumber(variantsOf(value)[0]?.size,0)}
function variantSizeText(value:any){const sizes=variantsOf(value).map(item=>finiteNumber(item.size,0)).filter(size=>size>0).sort((a,b)=>a-b);return sizes.length?`${sizes.map(formatNumber).join(' / ')} mm`:'未设置尺寸'}
function priceRangeText(value:any){const prices=variantsOf(value).map(item=>Math.max(0,finiteNumber(item.price,0))).sort((a,b)=>a-b);if(!prices.length)return money(0);return prices[0]===prices[prices.length-1]?money(prices[0]):`${money(prices[0])}～${money(prices[prices.length-1])}`}
function signedNumber(value:unknown){const number=finiteNumber(value,0);return number>0?`+${formatNumber(number)}`:formatNumber(number)}
function layerText(row:any){const explicit=Number(row.layer);return row.layer!==null&&row.layer!==undefined&&row.layer!==''&&Number.isFinite(explicit)?String(explicit):`${booleanValue(row.is_irregular)?25:20} 自动`}
function hasDataIssue(item:any){return !String(item.image||'').trim()||(item.stringing_position==='top'&&!positiveNumber(item.stringing_width_mm))}
function countByCategory(label:string){return beads.value.filter(item=>item.category===label).length}
function cloneCategories(value:Category[]){return value.map(item=>({...item}))}
function cloneSubcategories(value:Record<string,Category[]>){return Object.fromEntries(Object.entries(value).map(([key,items])=>[key,cloneCategories(items)]))}
function countBySubcategory(categoryId:string,label:string){
  const category=categories.value.find(item=>item.id===categoryId)
  if(!category)return 0
  const field=categoryId==='peishi'?'subcategory':'color_family'
  return beads.value.filter(item=>item.category===category.label&&String(item[field]||'')===label).length
}

function selectCategory(label:string){activeCategory.value=label;subcategoryFilter.value=undefined}
function applyQuickFilter(value:RenderFilter){keyword.value='';activeCategory.value='';subcategoryFilter.value=undefined;materialFilter.value=undefined;renderFilter.value=value}
function resetFilters(){keyword.value='';activeCategory.value='';subcategoryFilter.value=undefined;materialFilter.value=undefined;renderFilter.value=''}

async function load(){
  loading.value=true
  try{
    beads.value=listFrom(await get('/api/bead/list'))
    const config:any=await get('/api/admin/bead_category_config')
    if(Array.isArray(config.categories)&&config.categories.length)categories.value=config.categories
    if(config.subcategories&&typeof config.subcategories==='object')subcategories.value=config.subcategories
    if(!categories.value.some(x=>x.id===activeSubId.value))activeSubId.value=categories.value[0]?.id||''
    savedCategories.value=cloneCategories(categories.value)
    savedSubcategories.value=cloneSubcategories(subcategories.value)
  }catch(e){message.error(errorMessage(e))}finally{loading.value=false}
}

function openCreate(){Object.assign(form,emptyForm());form.category=categories.value[0]?.label||'';categoryChanged();editorTab.value='base';editorOpen.value=true}
function openEdit(row:any){Object.assign(form,emptyForm(),row,{id:String(row.id||row.group_id||''),variants:variantsOf(row).map(item=>({id:Number(item.id)||null,size:finiteNumber(item.size,0),price:Math.max(0,finiteNumber(item.price,0))})),canvas_image:String(row.canvas_image||''),stringing_width_mm:positiveNumber(row.stringing_width_mm),stringing_position:row.stringing_position==='top'?'top':'center',stringing_offset_mm:finiteNumber(row.stringing_offset_mm,0),image_scale:positiveNumber(row.image_scale)||1,is_irregular:booleanValue(row.is_irregular),layer:row.layer===null||row.layer===undefined||row.layer===''?null:finiteNumber(row.layer,0)});editorTab.value='base';editorOpen.value=true}
function categoryChanged(){form.subcategory='';form.color_family='';const first=currentSubcategories.value[0]?.label||'';if(isAccessory.value)form.subcategory=first;else form.color_family=first}
function subChanged(value:string){if(isAccessory.value)form.subcategory=value;else form.color_family=value}
function addVariant(){const last=form.variants[form.variants.length-1];form.variants.push({id:null,size:Number(((last?.size||8)+2).toFixed(1)),price:last?.price||0})}
function removeVariant(index:number){if(form.variants.length<=1)return;form.variants.splice(index,1)}
function handleIrregularChange(checked:boolean){if(!checked)return;if(form.variants.length>1){form.is_irregular=false;message.warning('异形材质只能设置一个尺寸，请先删除多余尺寸')}}
function validateVariants(){if(!form.variants.length)return '至少需要一个尺寸规格';if(form.is_irregular&&form.variants.length!==1)return '异形材质只能设置一个尺寸';const sizes=new Set<string>();for(const variant of form.variants){const size=Number(variant.size),price=Number(variant.price);if(!Number.isFinite(size)||size<=0)return '珠子尺寸必须大于 0';if(!Number.isFinite(price)||price<0)return '销售价格不能小于 0';const key=String(Number(size.toFixed(3)));if(sizes.has(key))return `尺寸 ${key}mm 重复`;sizes.add(key)}return ''}

async function save(){
  try{
    await formRef.value?.validate()
    if(isAccessory.value&&!form.subcategory){editorTab.value='base';return message.warning('请选择配饰子分类')}
    if(!isAccessory.value&&!form.color_family){editorTab.value='base';return message.warning('请选择色系')}
    const variantError=validateVariants();if(variantError){editorTab.value='base';return message.warning(variantError)}
    saving.value=true
    await post(form.id?'/api/bead/update':'/api/bead/create',{...form})
    message.success(form.id?'珠材已更新':'珠材已创建')
    editorOpen.value=false
    await load()
  }catch(e){if(e instanceof Error)message.error(errorMessage(e))}finally{saving.value=false}
}

function remove(row:any){Modal.confirm({title:`删除珠材“${row.name}”？`,content:'已使用该珠材的历史设计可能失去完整资料，此操作不可撤销。',okText:'确认删除',cancelText:'取消',okType:'danger',async onOk(){try{await post('/api/bead/delete',{id:row.id});message.success('珠材已删除');await load()}catch(e){message.error(errorMessage(e))}}})}
function openCategorySettings(){categories.value=cloneCategories(savedCategories.value);subcategories.value=cloneSubcategories(savedSubcategories.value);if(!categories.value.some(item=>item.id===activeSubId.value))activeSubId.value=categories.value[0]?.id||'';categoryOpen.value=true}
function resetCategoryDrafts(){categories.value=cloneCategories(savedCategories.value);subcategories.value=cloneSubcategories(savedSubcategories.value);draggingCategory.value=null;draggingSub.value=null}
function reorder<T>(list:T[],from:number,to:number){if(from===to||from<0||to<0||from>=list.length||to>=list.length)return;const [item]=list.splice(from,1);if(item!==undefined)list.splice(to,0,item)}
function startCategoryDrag(index:number,event:DragEvent){draggingCategory.value=index;if(event.dataTransfer)event.dataTransfer.effectAllowed='move'}
function dropCategory(index:number){if(draggingCategory.value===null)return;reorder(categories.value,draggingCategory.value,index);draggingCategory.value=null}
function startSubDrag(index:number,event:DragEvent){draggingSub.value=index;if(event.dataTransfer)event.dataTransfer.effectAllowed='move'}
function dropSub(index:number){if(draggingSub.value===null)return;reorder(currentConfigSubs.value,draggingSub.value,index);draggingSub.value=null}
function moveCategory(index:number,offset:number){const target=index+offset;if(target<0||target>=categories.value.length)return;[categories.value[index],categories.value[target]]=[categories.value[target]!,categories.value[index]!]}
function addCategory(){categories.value.push({id:`category_${Date.now()}`,label:'新分类'})}
function deleteCategory(index:number){const cat=categories.value[index]!;const used=countByCategory(cat.label);if(used>0)return message.warning(`分类“${cat.label}”仍有 ${used} 个素材，请先修改或删除这些素材`);Modal.confirm({title:`删除空分类“${cat.label}”？`,content:'该主分类及其下面的空子分类配置会一起删除。',okText:'确认删除',cancelText:'取消',okType:'danger',onOk(){categories.value.splice(index,1);delete subcategories.value[cat.id];if(activeSubId.value===cat.id)activeSubId.value=categories.value[0]?.id||''}})}
async function saveCategories(){const labels=categories.value.map(x=>x.label.trim()),ids=categories.value.map(x=>x.id.trim());if(labels.some(x=>!x)||new Set(labels).size!==labels.length)return message.warning('分类名称不能为空且不能重复');if(ids.some(x=>!x)||new Set(ids).size!==ids.length)return message.warning('分类编码不能为空且不能重复');savingConfig.value=true;try{await post('/api/admin/bead_main_categories_save',{categories:categories.value});savedCategories.value=cloneCategories(categories.value);categoryOpen.value=false;message.success('主分类名称和排序已同步');await load()}catch(e){message.error(errorMessage(e))}finally{savingConfig.value=false}}
function moveSub(index:number,offset:number){const list=currentConfigSubs.value,target=index+offset;if(target<0||target>=list.length)return;[list[index],list[target]]=[list[target]!,list[index]!]}
function addSub(){currentConfigSubs.value.push({id:`option_${Date.now()}`,label:'新选项'})}
function deleteSub(index:number){const sub=currentConfigSubs.value[index]!;const used=countBySubcategory(activeSubId.value,sub.label);if(used>0)return message.warning(`子分类“${sub.label}”仍有 ${used} 个素材，请先修改或删除这些素材`);Modal.confirm({title:`删除空子分类“${sub.label}”？`,content:'删除后需要点击“保存配置”才会生效。',okText:'确认删除',cancelText:'取消',okType:'danger',onOk(){currentConfigSubs.value.splice(index,1)}})}
async function saveSubcategories(){const allOptions=Object.values(subcategories.value).flat();if(allOptions.some(x=>!x.id.trim()||!x.label.trim()))return message.warning('名称和编码不能为空');for(const list of Object.values(subcategories.value)){if(new Set(list.map(x=>x.id)).size!==list.length)return message.warning('同一分类下编码不能重复');if(new Set(list.map(x=>x.label)).size!==list.length)return message.warning('同一分类下名称不能重复')}savingConfig.value=true;try{await post('/api/admin/bead_subcategories_save',{subcategories:subcategories.value});savedSubcategories.value=cloneSubcategories(subcategories.value);message.success('子分类名称和排序已同步');await load()}catch(e){message.error(errorMessage(e))}finally{savingConfig.value=false}}

onMounted(load)
</script>

<style scoped>
.bead-catalog{--catalog-green:#1f6a56;--catalog-ink:#203b33;--catalog-line:#e5ebe8}.catalog-stats{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px}.catalog-stats button{display:flex;align-items:center;gap:12px;min-width:0;padding:16px;border:1px solid rgba(31,106,86,.09);border-radius:15px;background:#fff;box-shadow:0 8px 24px rgba(25,61,52,.04);cursor:pointer;text-align:left;transition:.18s ease}.catalog-stats button:hover,.catalog-stats button.active{border-color:rgba(31,106,86,.3);box-shadow:0 10px 28px rgba(25,61,52,.09);transform:translateY(-1px)}.catalog-stats button.active{background:linear-gradient(135deg,#fff,#f3f8f6)}.catalog-stats button>span:last-child{display:flex;min-width:0;flex-direction:column}.catalog-stats small{color:#7d8e87;font-size:11px}.catalog-stats b{margin:2px 0;color:var(--catalog-ink);font-size:24px;line-height:1.15}.catalog-stats em{overflow:hidden;color:#a0aba7;font-size:10px;font-style:normal;text-overflow:ellipsis;white-space:nowrap}.stat-icon{display:grid;place-items:center;flex:0 0 38px;height:38px;border-radius:11px;font-size:17px}.stat-icon.green{color:#256b58;background:#e9f4ef}.stat-icon.amber{color:#a66b25;background:#fff1df}.stat-icon.blue{color:#326f9c;background:#eaf4fb}.stat-icon.violet{color:#745c9f;background:#f1edfa}.stat-icon.red{color:#b05b52;background:#fff0ee}
.filter-card{border:1px solid rgba(31,106,86,.08)!important;border-radius:16px!important;box-shadow:0 8px 24px rgba(25,61,52,.04)}.filter-main{display:flex;align-items:center;gap:10px}.keyword-input{width:min(320px,100%)}.filter-select{width:160px}.category-tabs{display:flex;gap:8px;margin-top:16px;padding-top:14px;border-top:1px solid var(--catalog-line);overflow:auto}.category-tabs button{flex:0 0 auto;padding:7px 12px;border:1px solid transparent;border-radius:9px;color:#657770;background:#f5f7f6;cursor:pointer}.category-tabs button span{margin-left:5px;color:#9aa6a1}.category-tabs button.active{border-color:#bdd7cf;color:#1d614f;background:#eaf3ef}.filter-result{display:flex;justify-content:space-between;margin-top:12px;color:#8a9893;font-size:12px}.filter-result b{color:#2d6052}.filter-hint{padding-left:16px;position:relative}.filter-hint:before{position:absolute;top:50%;left:4px;width:5px;height:5px;border-radius:50%;background:#d29b4c;content:'';transform:translateY(-50%)}
.catalog-table-card{overflow:hidden;border-radius:16px!important}.catalog-table-card :deep(.ant-card-body){padding:0}.catalog-table-card :deep(.ant-table-thead>tr>th){padding:14px 16px;color:#6b7d76;background:#f8faf9;font-size:12px;font-weight:650}.catalog-table-card :deep(.ant-table-tbody>tr>td){padding:14px 16px;border-bottom-color:#edf1ef}.catalog-table-card :deep(.ant-table-tbody>tr:hover>td){background:#f8fbfa!important}.catalog-table-card :deep(.ant-table-tbody>tr.data-issue-row>td:first-child){box-shadow:inset 3px 0 #d99b56}.catalog-table-card :deep(.ant-pagination){margin:18px 20px}
.material-cell{display:flex;align-items:center;gap:12px}.material-thumb-wrap{position:relative;flex:0 0 54px}.bead-image,:deep(.bead-image img){border:1px solid #e7ecea;border-radius:14px;object-fit:contain;background:#f5f7f6}.empty-thumb{display:grid;place-items:center;width:54px;height:54px;border:1px dashed #d7e0dc;border-radius:14px;color:#a5b0ac;background:#f5f7f6;font-size:18px}.issue-dot{position:absolute;top:-3px;right:-3px;width:10px;height:10px;border:2px solid #fff;border-radius:50%;background:#dd9650}.material-copy{min-width:0}.material-name{overflow:hidden;color:#263f37;font-weight:650;text-overflow:ellipsis;white-space:nowrap}.material-en{overflow:hidden;margin-top:3px;color:#87948f;font-size:11px;text-overflow:ellipsis;white-space:nowrap}.material-id{margin-top:4px;color:#adb6b2;font-family:Consolas,monospace;font-size:10px}.category-cell{display:flex;align-items:flex-start;flex-direction:column;gap:6px}.category-cell span{color:#7e8d87;font-size:11px}.commerce-cell{display:flex;flex-direction:column;gap:5px}.commerce-cell>div{display:flex;align-items:center;gap:7px}.commerce-cell>div span{color:#83918c;font-size:11px}.commerce-cell strong{color:#a86e29;font-size:14px}.commerce-cell small{color:#a2aca8}.config-cell{display:flex;flex-direction:column;gap:7px}.config-tags{display:flex;gap:4px}.config-cell>div:not(.config-tags){display:flex;justify-content:space-between;gap:10px;font-size:11px}.config-cell>div span{color:#98a49f}.config-cell>div b{color:#53665f;font-weight:550;text-align:right}.render-cell{display:flex;flex-direction:column;gap:8px}.render-image-status{display:flex;align-items:center;gap:8px}.canvas-image,:deep(.canvas-image img){border-radius:9px;object-fit:contain;background:#f4f6f5}.fallback-canvas{display:grid;place-items:center;width:34px;height:34px;border-radius:9px;color:#8ea09a;background:#eef3f1}.render-image-status>div{display:flex;min-width:0;flex-direction:column}.render-image-status b{color:#4c6159;font-size:11px}.render-image-status small{margin-top:2px;color:#a0aaa6;font-size:9px}.render-meta{display:flex;gap:6px}.render-meta span{padding:3px 6px;border-radius:6px;color:#75857f;background:#f3f6f5;font-size:9px}.row-actions{display:flex;align-items:center;justify-content:flex-end;gap:2px}.edit-button{color:#246b57}
.editor-hero{display:flex;align-items:center;gap:14px;margin:-8px 0 6px;padding:14px;border:1px solid #e4ece8;border-radius:14px;background:linear-gradient(135deg,#f7faf9,#eef5f2)}.editor-image,:deep(.editor-image img){flex:0 0 72px;border:1px solid #dfe8e4;border-radius:16px;object-fit:contain;background:#fff}.editor-image.empty{display:grid;place-items:center;color:#9caaa5;font-size:22px}.editor-identity{display:flex;min-width:0;flex:1;flex-direction:column}.editor-identity small{color:#94a19c;font-size:10px}.editor-identity b{overflow:hidden;margin:3px 0;color:#21473c;font-size:18px;text-overflow:ellipsis;white-space:nowrap}.editor-identity span{color:#72847d;font-size:12px}.editor-badges{display:flex;align-items:flex-end;flex-direction:column;gap:5px}.editor-tabs :deep(.ant-tabs-nav){margin-bottom:16px}.editor-tabs :deep(.ant-tabs-tab){padding:13px 4px}.editor-section{margin-bottom:14px;padding:16px;border:1px solid #e6ece9;border-radius:14px;background:#fff}.section-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:16px}.section-heading>div{display:flex;flex-direction:column}.section-heading b{color:#294b40;font-size:14px}.section-heading span{margin-top:3px;color:#94a09b;font-size:11px}.editor-section :deep(.ant-form-item:last-child){margin-bottom:0}.media-explainer{display:flex;align-items:flex-start;gap:10px;margin-bottom:14px;padding:11px 12px;border-radius:10px;color:#497063;background:#eef5f2}.media-explainer>span{display:flex;flex-direction:column}.media-explainer b{font-size:12px}.media-explainer small{margin-top:2px;color:#71877f;font-size:11px;line-height:1.5}.image-actions{display:flex;justify-content:flex-end;margin-top:5px}.render-summary{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px}.render-summary>div{display:flex;flex-direction:column;padding:13px;border-radius:12px;background:#eef5f2}.render-summary small{color:#7c8d86;font-size:10px}.render-summary b{margin:3px 0;color:#245747;font-size:18px}.render-summary span{color:#98a49f;font-size:9px}.field-help{margin-top:6px;color:#89958f;font-size:11px;line-height:1.55}.switch-row{display:flex;align-items:center;gap:10px;height:32px}.switch-row span{color:#7f8f89;font-size:11px}.drawer-footer{display:flex;align-items:center;justify-content:space-between;gap:12px}.drawer-footer>span{color:#919e99;font-size:11px}.drawer-footer>div{display:flex;gap:8px}
.variant-editor{margin-bottom:22px;padding:14px;border:1px solid #e5ece9;border-radius:12px;background:#fafcfb}.variant-editor__head{display:flex;align-items:center;justify-content:space-between;gap:16px}.variant-editor__head>div{display:flex;min-width:0;flex-direction:column}.variant-editor__head b{color:#35584d;font-size:13px}.variant-editor__head span{margin-top:3px;color:#8d9a95;font-size:11px}.variant-editor__columns,.variant-row{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr) 34px;align-items:center;gap:10px}.variant-editor__columns{margin-top:14px;padding:0 2px 6px;color:#99a49f;font-size:10px}.variant-row{padding:9px 0;border-top:1px solid #edf1ef}.variant-row>:deep(.ant-btn){display:inline-flex;width:34px;height:34px;align-items:center;justify-content:center;padding:0}
.config-intro{display:flex;align-items:center;gap:12px;margin-bottom:14px;padding:12px 14px;border-radius:11px;color:#3e695d;background:#edf5f2}.config-intro>span{display:flex;flex-direction:column}.config-intro b{font-size:12px}.config-intro small{margin-top:2px;color:#7f918a;font-size:10px}.config-column-head{display:grid;grid-template-columns:56px 1.2fr 1fr 118px;gap:8px;padding:0 8px 7px;color:#9aa6a1;font-size:9px}.config-column-head span:last-child{text-align:center}.category-editor{display:flex;flex-direction:column;gap:8px;max-height:430px;padding:2px;overflow:auto}.category-row{display:grid;grid-template-columns:48px 1.2fr 1fr 34px 34px 34px;align-items:center;gap:8px;padding:8px;border:1px solid #e8eeeb;border-radius:11px;background:#fff;transition:.15s ease}.category-row:hover{border-color:#c9ddd6;background:#fbfdfc}.category-row.dragging{opacity:.48;border-color:#7aa898}.category-row>:deep(.ant-btn){display:inline-flex;width:34px;height:34px;align-items:center;justify-content:center;padding:0;line-height:1}.category-row>:deep(.ant-btn .anticon){display:inline-flex;align-items:center;justify-content:center;margin:0;line-height:1}.sort-handle{display:flex;align-items:center;justify-content:center;gap:5px;color:#9ba7a2;cursor:grab}.sort-handle b{color:#53736a;font:10px Consolas,monospace}.config-field{display:flex;min-width:0;flex-direction:column}.config-field small{margin-top:3px;color:#9aa6a1;font-size:9px}.config-actions{display:flex;justify-content:space-between;margin-top:18px}.subcategory-tip{display:flex;align-items:baseline;gap:8px;margin:14px 2px 9px}.subcategory-tip b{color:#35594e;font-size:11px}.subcategory-tip span{color:#96a29d;font-size:9px}.sub-editor{margin-top:0}
@media(max-width:1180px){.catalog-stats{grid-template-columns:repeat(3,1fr)}.catalog-stats button:nth-child(4),.catalog-stats button:nth-child(5){display:none}.filter-main{flex-wrap:wrap}.keyword-input{flex:1 1 260px}.filter-select{flex:1 1 140px}}
@media(max-width:760px){.catalog-stats{grid-template-columns:repeat(2,1fr)}.catalog-stats button:nth-child(3){display:none}.filter-main{align-items:stretch;flex-direction:column}.keyword-input,.filter-select{width:100%}.render-summary{grid-template-columns:1fr}.editor-hero{align-items:flex-start}.editor-badges{display:none}.drawer-footer>span{display:none}.drawer-footer{justify-content:flex-end}.category-row{grid-template-columns:20px 1fr 1fr 32px}.category-row button:nth-last-child(2),.category-row button:nth-last-child(3){display:none}}
</style>
