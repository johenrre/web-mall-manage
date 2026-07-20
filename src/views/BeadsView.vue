<template>
  <div class="page-shell">
    <PageHeader title="盘珠管理" description="维护珠材资料、价格、图片与商城分类体系">
      <a-input-search v-model:value="keyword" allow-clear placeholder="搜索中英文名称" style="width:240px" />
      <a-button @click="categoryOpen=true"><ApartmentOutlined /> 分类设置</a-button>
      <a-button type="primary" @click="openCreate"><PlusOutlined /> 新增盘珠</a-button>
    </PageHeader>

    <div class="category-tabs">
      <button :class="{active:activeCategory===''}" @click="activeCategory=''">全部 <span>{{ beads.length }}</span></button>
      <button v-for="cat in categories" :key="cat.id" :class="{active:activeCategory===cat.label}" @click="activeCategory=cat.label">{{ cat.label }} <span>{{ countByCategory(cat.label) }}</span></button>
    </div>

    <a-card class="surface-card" :bordered="false">
      <a-table row-key="id" :columns="columns" :data-source="filtered" :loading="loading" :scroll="{x:1200}" :pagination="{pageSize:20,showSizeChanger:true,showTotal:(n:number)=>`共 ${n} 种珠材`}">
        <template #bodyCell="{column,record}">
          <template v-if="column.key==='bead'"><div class="table-user"><a-image :src="resolveMedia(record.image)" :width="48" :height="48" class="bead-image" fallback="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48'%3E%3Crect width='100%25' height='100%25' fill='%23edf2ef'/%3E%3C/svg%3E"/><div><b>{{ record.name }}</b><div class="muted">{{ record.name_en||'—' }}</div></div></div></template>
          <template v-else-if="column.key==='category'"><a-tag color="green" :bordered="false">{{ record.category||'未分类' }}</a-tag><div class="muted subcategory">{{ record.subcategory||record.color_family||'—' }}</div></template>
          <template v-else-if="column.key==='material'"><b>{{ materialLabels[record.type]||record.type }}</b><div class="muted">{{ record.size }} mm</div></template>
          <template v-else-if="column.key==='price'"><span class="money">{{ money(record.price) }}</span></template>
          <template v-else-if="column.key==='action'"><a-space><a-button type="link" size="small" @click="openEdit(record)">编辑</a-button><a-button type="link" size="small" danger @click="remove(record)">删除</a-button></a-space></template>
        </template>
        <template #emptyText><a-empty description="没有匹配的盘珠" /></template>
      </a-table>
    </a-card>

    <a-drawer v-model:open="editorOpen" :title="form.id?'编辑盘珠':'新增盘珠'" :width="600">
      <a-form ref="formRef" layout="vertical" :model="form" :rules="rules">
        <div class="form-grid">
          <a-form-item label="中文名称" name="name"><a-input v-model:value="form.name" /></a-form-item>
          <a-form-item label="英文名称"><a-input v-model:value="form.name_en" placeholder="留空将自动翻译" /></a-form-item>
          <a-form-item label="繁体名称"><a-input v-model:value="form.name_zh_tw" placeholder="留空将自动转换" /></a-form-item>
          <a-form-item label="分类排序"><a-input-number v-model:value="form.category_sort_order" :min="1" style="width:100%" /></a-form-item>
          <a-form-item label="主分类" name="category"><a-select v-model:value="form.category" :options="categories.map(x=>({label:x.label,value:x.label}))" @change="categoryChanged" /></a-form-item>
          <a-form-item :label="isAccessory?'配饰子分类':'色系'" :name="isAccessory?'subcategory':'color_family'"><a-select v-if="currentSubcategories.length" :value="isAccessory?form.subcategory:form.color_family" :options="currentSubcategories.map(x=>({label:x.label,value:x.label}))" @change="subChanged" /><a-input v-else :value="isAccessory?form.subcategory:form.color_family" @update:value="subChanged" /></a-form-item>
          <a-form-item label="材质类型" name="type"><a-select v-model:value="form.type" :options="materialOptions" /></a-form-item>
          <a-form-item label="珠子尺寸（mm）" name="size"><a-input-number v-model:value="form.size" :min="0.1" :step="0.1" style="width:100%" /></a-form-item>
          <a-form-item label="销售价格" name="price"><a-input-number v-model:value="form.price" :min="0" :precision="2" prefix="¥" style="width:100%" /></a-form-item>
          <a-form-item class="span-2" label="盘珠图片"><ImageUploader v-model="form.image" /></a-form-item>
          <a-form-item class="span-2" label="珠材描述"><a-textarea v-model:value="form.description" :rows="4" maxlength="500" show-count /></a-form-item>
        </div>
      </a-form>
      <template #footer><div class="drawer-footer"><a-button @click="editorOpen=false">取消</a-button><a-button type="primary" :loading="saving" @click="save">保存盘珠</a-button></div></template>
    </a-drawer>

    <a-modal v-model:open="categoryOpen" title="盘珠分类设置" :width="760" :footer="null">
      <a-tabs v-model:active-key="categoryTab">
        <a-tab-pane key="main" tab="主分类">
          <div class="config-tip">调整后的顺序会同步到盘珠筛选和商城配置。</div>
          <div class="category-editor"><div v-for="(cat,index) in categories" :key="cat.id" class="category-row"><HolderOutlined class="drag"/><a-input v-model:value="cat.label"/><a-input v-model:value="cat.id" disabled/><a-button :disabled="index===0" @click="moveCategory(index,-1)"><ArrowUpOutlined/></a-button><a-button :disabled="index===categories.length-1" @click="moveCategory(index,1)"><ArrowDownOutlined/></a-button><a-button danger @click="deleteCategory(index)"><DeleteOutlined/></a-button></div></div>
          <div class="config-actions"><a-button @click="addCategory"><PlusOutlined/> 新增分类</a-button><a-button type="primary" :loading="savingConfig" @click="saveCategories">保存主分类</a-button></div>
        </a-tab-pane>
        <a-tab-pane key="sub" tab="子分类 / 色系">
          <a-segmented v-model:value="activeSubId" :options="categories.map(x=>({label:x.label,value:x.id}))" block />
          <div class="category-editor sub-editor"><div v-for="(sub,index) in currentConfigSubs" :key="`${sub.id}-${index}`" class="category-row"><HolderOutlined class="drag"/><a-input v-model:value="sub.label" placeholder="显示名称"/><a-input v-model:value="sub.id" placeholder="唯一编码"/><a-button :disabled="index===0" @click="moveSub(index,-1)"><ArrowUpOutlined/></a-button><a-button :disabled="index===currentConfigSubs.length-1" @click="moveSub(index,1)"><ArrowDownOutlined/></a-button><a-button danger @click="deleteSub(index)"><DeleteOutlined/></a-button></div></div>
          <div class="config-actions"><a-button @click="addSub"><PlusOutlined/> 新增{{ activeSubId==='peishi'?'子分类':'色系' }}</a-button><a-button type="primary" :loading="savingConfig" @click="saveSubcategories">保存配置</a-button></div>
        </a-tab-pane>
      </a-tabs>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed,onMounted,reactive,ref } from 'vue'
import { message,Modal,type FormInstance } from 'ant-design-vue'
import { ApartmentOutlined,ArrowDownOutlined,ArrowUpOutlined,DeleteOutlined,HolderOutlined,PlusOutlined } from '@ant-design/icons-vue'
import PageHeader from '@/components/PageHeader.vue'
import ImageUploader from '@/components/ImageUploader.vue'
import { errorMessage,get,post } from '@/api/http'
import { listFrom,money,resolveMedia } from '@/utils/format'

interface Category{ id:string; label:string }
const defaults:Category[]=[{id:'crystal',label:'水晶'},{id:'chxiang',label:'沉香'},{id:'puti',label:'菩提'},{id:'wenwan',label:'文玩'},{id:'peishi',label:'配饰'}]
const loading=ref(false),saving=ref(false),savingConfig=ref(false),beads=ref<any[]>([]),keyword=ref(''),activeCategory=ref(''),editorOpen=ref(false),categoryOpen=ref(false),categoryTab=ref('main'),formRef=ref<FormInstance>()
const categories=ref<Category[]>(structuredClone(defaults)),subcategories=ref<Record<string,Category[]>>({}),activeSubId=ref('crystal')
const materialLabels:Record<string,string>={wood:'木质',stone:'石质',glass:'玻璃',metal:'金属'}
const materialOptions=Object.entries(materialLabels).map(([value,label])=>({value,label}))
const emptyForm=()=>({id:0,name:'',name_en:'',name_zh_tw:'',category:'水晶',subcategory:'',category_sort_order:100,color_family:'',type:'stone',size:8,price:0,image:'',description:''})
const form=reactive(emptyForm())
const rules={name:[{required:true,message:'请输入中文名称'}],category:[{required:true,message:'请选择主分类'}],type:[{required:true,message:'请选择材质'}],size:[{required:true,message:'请输入尺寸'}],price:[{required:true,message:'请输入价格'}]}
const columns=[{title:'盘珠',key:'bead',width:250},{title:'分类',key:'category',width:150},{title:'材质 / 尺寸',key:'material',width:150},{title:'排序',dataIndex:'category_sort_order',width:90},{title:'价格',key:'price',width:110},{title:'繁体名称',dataIndex:'name_zh_tw',width:160},{title:'操作',key:'action',width:140,fixed:'right' as const}]
const filtered=computed(()=>beads.value.filter(item=>(!activeCategory.value||item.category===activeCategory.value)&&(!keyword.value.trim()||[item.name,item.name_en,item.name_zh_tw].some(x=>String(x||'').toLowerCase().includes(keyword.value.trim().toLowerCase())))))
const selectedCategory=computed(()=>categories.value.find(x=>x.label===form.category))
const isAccessory=computed(()=>selectedCategory.value?.id==='peishi'||form.category==='配饰')
const currentSubcategories=computed(()=>subcategories.value[selectedCategory.value?.id||'']||[])
const currentConfigSubs=computed(()=>subcategories.value[activeSubId.value]||(subcategories.value[activeSubId.value]=[]))
function countByCategory(label:string){return beads.value.filter(x=>x.category===label).length}
async function load(){loading.value=true;try{beads.value=listFrom(await get('/api/bead/list'));const settings:any=await get('/api/admin/settings_get');try{const parsed=JSON.parse(settings.bead_main_categories_json||'[]');if(Array.isArray(parsed)&&parsed.length)categories.value=parsed}catch{}try{const parsed=JSON.parse(settings.bead_subcategories_by_category_json||'{}');if(parsed&&typeof parsed==='object')subcategories.value=parsed}catch{}if(!categories.value.some(x=>x.id===activeSubId.value))activeSubId.value=categories.value[0]?.id||''}catch(e){message.error(errorMessage(e))}finally{loading.value=false}}
function openCreate(){Object.assign(form,emptyForm());form.category=categories.value[0]?.label||'';categoryChanged();editorOpen.value=true}
function openEdit(row:any){Object.assign(form,emptyForm(),row);editorOpen.value=true}
function categoryChanged(){form.subcategory='';form.color_family='';const first=currentSubcategories.value[0]?.label||'';if(isAccessory.value)form.subcategory=first;else form.color_family=first}
function subChanged(value:string){if(isAccessory.value)form.subcategory=value;else form.color_family=value}
async function save(){try{await formRef.value?.validate();if(isAccessory.value&&!form.subcategory)return message.warning('请选择配饰子分类');if(!isAccessory.value&&!form.color_family)return message.warning('请选择色系');saving.value=true;await post(form.id?'/api/bead/update':'/api/bead/create',{...form});message.success(form.id?'盘珠已更新':'盘珠已创建');editorOpen.value=false;await load()}catch(e){if(e instanceof Error)message.error(errorMessage(e))}finally{saving.value=false}}
function remove(row:any){Modal.confirm({title:`删除盘珠“${row.name}”？`,content:'已使用该珠材的历史设计可能失去完整资料。',okText:'确认删除',okType:'danger',async onOk(){try{await post('/api/bead/delete',{id:row.id});message.success('盘珠已删除');await load()}catch(e){message.error(errorMessage(e))}}})}
function moveCategory(index:number,offset:number){const target=index+offset;if(target<0||target>=categories.value.length)return;[categories.value[index],categories.value[target]]=[categories.value[target]!,categories.value[index]!]}function addCategory(){categories.value.push({id:`category_${Date.now()}`,label:'新分类'})}
function deleteCategory(index:number){const cat=categories.value[index]!;const used=countByCategory(cat.label);Modal.confirm({title:`删除分类“${cat.label}”？`,content:used?`仍有 ${used} 个盘珠使用该分类，请先迁移数据。`:'该分类的子分类配置也会保留，便于误删后恢复。',okType:'danger',onOk(){categories.value.splice(index,1)}})}
async function saveCategories(){const labels=categories.value.map(x=>x.label.trim());if(labels.some(x=>!x)||new Set(labels).size!==labels.length)return message.warning('分类名称不能为空且不能重复');savingConfig.value=true;try{await post('/api/admin/settings_update',{bead_main_categories_json:JSON.stringify(categories.value),bead_category_order:labels.join(',')});message.success('主分类配置已保存')}catch(e){message.error(errorMessage(e))}finally{savingConfig.value=false}}
function moveSub(index:number,offset:number){const list=currentConfigSubs.value,target=index+offset;if(target<0||target>=list.length)return;[list[index],list[target]]=[list[target]!,list[index]!]}function addSub(){currentConfigSubs.value.push({id:`option_${Date.now()}`,label:'新选项'})}function deleteSub(index:number){currentConfigSubs.value.splice(index,1)}
async function saveSubcategories(){const list=currentConfigSubs.value;if(list.some(x=>!x.id.trim()||!x.label.trim()))return message.warning('名称和编码不能为空');if(new Set(list.map(x=>x.id)).size!==list.length)return message.warning('编码不能重复');savingConfig.value=true;try{await post('/api/admin/settings_update',{bead_subcategories_by_category_json:JSON.stringify(subcategories.value),bead_category_subcategories_json:JSON.stringify(subcategories.value)});message.success('子分类配置已保存')}catch(e){message.error(errorMessage(e))}finally{savingConfig.value=false}}
onMounted(load)
</script>

<style scoped>
.category-tabs{display:flex;gap:8px;overflow:auto}.category-tabs button{flex:0 0 auto;padding:9px 14px;border:1px solid #e1e9e5;border-radius:10px;color:#657770;background:#fff;cursor:pointer}.category-tabs button span{margin-left:6px;color:#9aa6a1}.category-tabs button.active{border-color:#2a6d5a;color:#205b4b;background:#eaf3ef}.bead-image,:deep(.bead-image img){border-radius:50%;object-fit:cover}.subcategory{margin-top:4px;font-size:11px}.drawer-footer{display:flex;justify-content:flex-end;gap:8px}.config-tip{margin-bottom:14px;padding:10px 12px;border-radius:9px;color:#667970;background:#f0f5f2;font-size:12px}.category-editor{display:flex;flex-direction:column;gap:9px;max-height:430px;overflow:auto}.category-row{display:grid;grid-template-columns:24px 1.2fr 1fr 34px 34px 34px;align-items:center;gap:8px}.drag{color:#9ba7a2}.config-actions{display:flex;justify-content:space-between;margin-top:18px}.sub-editor{margin-top:18px}
@media(max-width:650px){.category-row{grid-template-columns:20px 1fr 1fr 32px}.category-row button:nth-last-child(2),.category-row button:nth-last-child(3){display:none}}
</style>
