<template>
  <div class="page-shell">
    <PageHeader title="商品管理" description="维护小程序商城的商品、展示销量和图片">
      <a-input-search v-model:value="keyword" allow-clear placeholder="搜索商品或分类" style="width:260px" @search="search" />
      <a-select v-model:value="status" :options="statusOptions" style="width:120px" @change="load" />
      <a-button :loading="loading" @click="load"><ReloadOutlined /> 刷新</a-button>
      <a-button @click="openCategorySettings"><ApartmentOutlined /> 分类设置</a-button>
      <a-button type="primary" @click="openCreate"><PlusOutlined /> 新增商品</a-button>
    </PageHeader>

    <a-card class="surface-card" :bordered="false">
      <a-table row-key="id" :columns="columns" :data-source="products" :loading="loading" :pagination="{pageSize:20,showSizeChanger:true}">
        <template #bodyCell="{column,record}">
          <template v-if="column.key==='product'"><div class="product-cell"><img v-if="record.images?.[0]" :src="resolveMedia(record.images[0])"/><div v-else class="product-image-empty"><PictureOutlined /></div><div><b>{{ record.title }}</b><small>{{ record.subtitle||'未填写副标题' }}</small></div></div></template>
          <template v-else-if="column.key==='category'"><b>{{ record.primary_category_name }}</b><small class="cell-note">{{ record.secondary_category_name }}</small></template>
          <template v-else-if="column.key==='price'"><b class="sale-price">{{ money(record.discount_price) }}</b><small class="original-price">{{ money(record.original_price) }}</small></template>
          <template v-else-if="column.key==='sold'">{{ record.sold_count||0 }}</template>
          <template v-else-if="column.key==='status'"><a-badge :status="record.status==='active'?'success':'default'" :text="record.status==='active'?'已上架':'已下架'" /></template>
          <template v-else-if="column.key==='action'"><a-space><a-button type="link" size="small" @click="openEdit(record)">编辑</a-button><a-button type="link" size="small" danger @click="remove(record)">删除</a-button></a-space></template>
        </template>
        <template #emptyText><a-empty description="还没有商城商品，点击右上角新增" /></template>
      </a-table>
    </a-card>

    <a-modal v-model:open="formOpen" :title="editingId?'编辑商品':'新增商品'" :width="880" ok-text="保存商品" :confirm-loading="saving" @ok="save">
      <a-form layout="vertical" class="product-form">
        <section class="form-section">
          <div class="form-section__heading"><h3>基本信息</h3><span>显示在商城列表和详情页</span></div>
          <a-form-item label="商品名称" required><a-input v-model:value="form.title" maxlength="100" show-count placeholder="例如：晴岚｜海蓝宝白水晶手串" /></a-form-item>
          <a-form-item label="商品副标题"><a-textarea v-model:value="form.subtitle" :rows="2" maxlength="200" show-count placeholder="简短说明材质和风格" /></a-form-item>
          <div class="form-grid">
            <a-form-item label="一级分类" required><a-select v-model:value="form.primary_category_id" :options="primaryOptions" @change="primaryChanged" /></a-form-item>
            <a-form-item label="二级分类" required><a-select v-model:value="form.secondary_category_id" :options="secondaryOptions" @change="secondaryChanged" /></a-form-item>
          </div>
        </section>

        <section class="form-section">
          <div class="form-section__heading"><h3>价格与展示</h3><span>销量为人工展示值，可随时修改</span></div>
          <div class="form-grid four">
            <a-form-item label="商品原价" required><a-input-number v-model:value="form.original_price" :min="0" :precision="2" prefix="¥" style="width:100%" /></a-form-item>
            <a-form-item label="折后价" required><a-input-number v-model:value="form.discount_price" :min="0" :precision="2" prefix="¥" style="width:100%" /></a-form-item>
            <a-form-item label="展示销量"><a-input-number v-model:value="form.sold_count" :min="0" :precision="0" style="width:100%" /></a-form-item>
            <a-form-item label="展示顺序"><a-input-number v-model:value="form.sort" :min="0" :precision="0" style="width:100%" /><div class="muted sort-tip">数字越小越靠前</div></a-form-item>
          </div>
          <a-form-item label="商品状态"><a-radio-group v-model:value="form.status" button-style="solid"><a-radio-button value="active">上架</a-radio-button><a-radio-button value="inactive">下架</a-radio-button></a-radio-group></a-form-item>
        </section>

        <section class="form-section">
          <div class="form-section__heading"><h3>商品轮播图</h3><span>第一张作为商城封面，最多 10 张</span></div>
          <div v-for="(_image,index) in form.images" :key="`gallery-${index}`" class="image-row"><span>{{ index===0?'封面':`第 ${index+1} 张` }}</span><ImageUploader v-model="form.images[index]" /><a-button v-if="form.images.length>1" type="text" danger @click="form.images.splice(index,1)"><DeleteOutlined /></a-button></div>
          <a-button v-if="form.images.length<10" type="dashed" block @click="form.images.push('')"><PlusOutlined /> 添加轮播图</a-button>
        </section>

        <section class="form-section">
          <div class="form-section__heading"><h3>商品详情图</h3><span>按当前顺序纵向展示，最多 20 张</span></div>
          <div v-for="(_image,index) in form.detail_images" :key="`detail-${index}`" class="image-row"><span>第 {{ index+1 }} 张</span><ImageUploader v-model="form.detail_images[index]" /><a-button type="text" danger @click="form.detail_images.splice(index,1)"><DeleteOutlined /></a-button></div>
          <a-button v-if="form.detail_images.length<20" type="dashed" block @click="form.detail_images.push('')"><PlusOutlined /> 添加详情图</a-button>
        </section>
      </a-form>
    </a-modal>

    <a-modal v-model:open="categoryOpen" title="商品分类设置" :width="820" :footer="null">
      <div class="category-intro"><ApartmentOutlined /><span><b>这里控制小程序商城的分类和展示顺序</b><small>修改名称会同步已有商品；仍有商品使用的分类不能删除。</small></span></div>
      <a-tabs v-model:active-key="categoryTab">
        <a-tab-pane key="primary" tab="一级分类">
          <div class="category-editor">
            <div v-for="(category,index) in categoryDrafts" :key="category.id" class="category-row">
              <b class="category-index">{{ index+1 }}</b>
              <a-input v-model:value="category.name" maxlength="30" placeholder="分类名称" />
              <span class="category-usage">{{ category.product_count||0 }} 个商品</span>
              <a-button :disabled="index===0" @click="moveCategory(categoryDrafts,index,-1)"><ArrowUpOutlined /></a-button>
              <a-button :disabled="index===categoryDrafts.length-1" @click="moveCategory(categoryDrafts,index,1)"><ArrowDownOutlined /></a-button>
              <a-button danger @click="deletePrimaryCategory(index)"><DeleteOutlined /></a-button>
            </div>
          </div>
          <a-button type="dashed" block class="category-add" @click="addPrimaryCategory"><PlusOutlined /> 新增一级分类</a-button>
        </a-tab-pane>
        <a-tab-pane key="secondary" tab="二级分类">
          <a-select v-model:value="activeCategoryId" :options="categoryDrafts.map(item=>({label:item.name||'未命名分类',value:item.id}))" class="category-parent-select" placeholder="先选择一级分类" />
          <div v-if="activeCategoryDraft" class="category-editor">
            <div v-for="(category,index) in activeCategoryDraft.children" :key="category.id" class="category-row">
              <b class="category-index">{{ index+1 }}</b>
              <a-input v-model:value="category.name" maxlength="30" placeholder="二级分类名称" />
              <span class="category-usage">{{ category.product_count||0 }} 个商品</span>
              <a-button :disabled="index===0" @click="moveCategory(activeCategoryDraft.children,index,-1)"><ArrowUpOutlined /></a-button>
              <a-button :disabled="index===activeCategoryDraft.children.length-1" @click="moveCategory(activeCategoryDraft.children,index,1)"><ArrowDownOutlined /></a-button>
              <a-button danger @click="deleteSecondaryCategory(index)"><DeleteOutlined /></a-button>
            </div>
          </div>
          <a-empty v-else description="请先新增一级分类" />
          <a-button v-if="activeCategoryDraft" type="dashed" block class="category-add" @click="addSecondaryCategory"><PlusOutlined /> 新增二级分类</a-button>
        </a-tab-pane>
      </a-tabs>
      <div class="category-actions"><a-button @click="categoryOpen=false">取消</a-button><a-button type="primary" :loading="savingCategories" @click="saveCategories">保存分类设置</a-button></div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed,onMounted,reactive,ref } from 'vue'
import { message,Modal } from 'ant-design-vue'
import { ApartmentOutlined,ArrowDownOutlined,ArrowUpOutlined,DeleteOutlined,PictureOutlined,PlusOutlined,ReloadOutlined } from '@ant-design/icons-vue'
import PageHeader from '@/components/PageHeader.vue'
import ImageUploader from '@/components/ImageUploader.vue'
import { errorMessage,get,post } from '@/api/http'
import { listFrom,money,resolveMedia } from '@/utils/format'

interface ProductForm {
  title:string
  subtitle:string
  original_price:number
  discount_price:number
  sold_count:number
  primary_category_id:string
  primary_category_name:string
  secondary_category_id:string
  secondary_category_name:string
  images:string[]
  detail_images:string[]
  status:'active'|'inactive'
  sort:number
}

interface ProductCategory {
  id:string
  name:string
  sort:number
  product_count:number
  children:ProductCategory[]
}

const emptyForm=():ProductForm=>({title:'',subtitle:'',original_price:0,discount_price:0,sold_count:0,primary_category_id:'',primary_category_name:'',secondary_category_id:'',secondary_category_name:'',images:[''],detail_images:[],status:'active',sort:100})
const columns=[{title:'商品',key:'product',width:330},{title:'分类',key:'category',width:130},{title:'价格',key:'price',width:120},{title:'展示销量',key:'sold',width:100},{title:'排序',dataIndex:'sort',width:80},{title:'状态',key:'status',width:100},{title:'操作',key:'action',width:130,fixed:'right' as const}]
const statusOptions=[{label:'全部状态',value:''},{label:'已上架',value:'active'},{label:'已下架',value:'inactive'}]
const loading=ref(false),saving=ref(false),savingCategories=ref(false),formOpen=ref(false),categoryOpen=ref(false),editingId=ref<number|null>(null),products=ref<any[]>([]),categories=ref<ProductCategory[]>([]),categoryDrafts=ref<ProductCategory[]>([]),keyword=ref(''),status=ref(''),categoryTab=ref('primary'),activeCategoryId=ref('')
const form=reactive<ProductForm>(emptyForm())
const primaryOptions=computed(()=>categories.value.map(item=>({label:item.name,value:item.id})))
const secondaryOptions=computed(()=>categories.value.find(item=>item.id===form.primary_category_id)?.children.map(item=>({label:item.name,value:item.id}))||[])
const activeCategoryDraft=computed(()=>categoryDrafts.value.find(item=>item.id===activeCategoryId.value))

function cloneCategories(value:ProductCategory[]):ProductCategory[]{return value.map(item=>({...item,children:item.children.map(child=>({...child,children:[]}))}))}
function createCategoryId(prefix:string){return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2,8)}`}
async function load(){loading.value=true;try{const [productData,categoryData]=await Promise.all([get('/api/admin/mall/products',{keyword:keyword.value.trim(),status:status.value}),get('/api/admin/mall/categories')]);products.value=listFrom(productData);categories.value=listFrom(categoryData) as ProductCategory[]}catch(e){message.error(errorMessage(e))}finally{loading.value=false}}
function search(){void load()}
function primaryChanged(value:string){const category=categories.value.find(item=>item.id===value);if(!category)return;form.primary_category_name=category.name;form.secondary_category_id=category.children[0]?.id||'';form.secondary_category_name=category.children[0]?.name||''}
function secondaryChanged(value:string){const category=categories.value.find(item=>item.id===form.primary_category_id);form.secondary_category_name=category?.children.find(item=>item.id===value)?.name||''}
function openCreate(){const first=categories.value.find(item=>item.children.length>0);if(!first)return message.warning('请先在分类设置中添加一级和二级分类');editingId.value=null;Object.assign(form,emptyForm());form.primary_category_id=first.id;form.primary_category_name=first.name;form.secondary_category_id=first.children[0]!.id;form.secondary_category_name=first.children[0]!.name;formOpen.value=true}
function openEdit(record:any){editingId.value=Number(record.id);Object.assign(form,{title:String(record.title||''),subtitle:String(record.subtitle||''),original_price:Number(record.original_price||0),discount_price:Number(record.discount_price||0),sold_count:Number(record.sold_count||0),primary_category_id:String(record.primary_category_id||''),primary_category_name:String(record.primary_category_name||''),secondary_category_id:String(record.secondary_category_id||''),secondary_category_name:String(record.secondary_category_name||''),images:Array.isArray(record.images)&&record.images.length?[...record.images]:[''],detail_images:Array.isArray(record.detail_images)?[...record.detail_images]:[],status:record.status==='inactive'?'inactive':'active',sort:Number(record.sort||100)});formOpen.value=true}
async function save(){const images=form.images.map(item=>item.trim()).filter(Boolean),detailImages=form.detail_images.map(item=>item.trim()).filter(Boolean);if(!form.title.trim())return message.warning('请填写商品名称');if(!form.primary_category_id||!form.secondary_category_id)return message.warning('请选择完整分类');if(form.discount_price>form.original_price)return message.warning('折后价不能高于原价');if(!images.length)return message.warning('请至少上传一张商品图片');saving.value=true;try{const payload={...form,id:editingId.value||undefined,title:form.title.trim(),subtitle:form.subtitle.trim(),images,detail_images:detailImages};await post(editingId.value?'/api/admin/mall/products/update':'/api/admin/mall/products/create',payload);message.success(editingId.value?'商品已更新':'商品已创建');formOpen.value=false;await load()}catch(e){message.error(errorMessage(e))}finally{saving.value=false}}
function remove(record:any){Modal.confirm({title:`删除商品“${record.title}”？`,content:'删除后小程序将无法再访问该商品，操作不可恢复。',okText:'确认删除',okType:'danger',cancelText:'取消',async onOk(){try{await post('/api/admin/mall/products/delete',{id:record.id});message.success('商品已删除');await load()}catch(e){message.error(errorMessage(e))}}})}
function openCategorySettings(){categoryDrafts.value=cloneCategories(categories.value);activeCategoryId.value=categoryDrafts.value[0]?.id||'';categoryTab.value='primary';categoryOpen.value=true}
function moveCategory(list:ProductCategory[],index:number,offset:number){const target=index+offset;if(target<0||target>=list.length)return;[list[index],list[target]]=[list[target]!,list[index]!]}
function addPrimaryCategory(){const category:ProductCategory={id:createCategoryId('mall_category'),name:'',sort:categoryDrafts.value.length+1,product_count:0,children:[]};categoryDrafts.value.push(category);activeCategoryId.value=category.id}
function addSecondaryCategory(){const parent=activeCategoryDraft.value;if(!parent)return;parent.children.push({id:createCategoryId('mall_subcategory'),name:'',sort:parent.children.length+1,product_count:0,children:[]})}
function deletePrimaryCategory(index:number){const category=categoryDrafts.value[index]!;if(category.product_count>0)return message.warning(`分类“${category.name}”仍有 ${category.product_count} 个商品，请先删除这些商品`);Modal.confirm({title:`删除空分类“${category.name||'未命名分类'}”？`,content:'该一级分类下面的空二级分类也会一起删除，保存后生效。',okText:'确认删除',okType:'danger',cancelText:'取消',onOk(){categoryDrafts.value.splice(index,1);if(activeCategoryId.value===category.id)activeCategoryId.value=categoryDrafts.value[0]?.id||''}})}
function deleteSecondaryCategory(index:number){const parent=activeCategoryDraft.value;if(!parent)return;const category=parent.children[index]!;if(category.product_count>0)return message.warning(`分类“${category.name}”仍有 ${category.product_count} 个商品，请先删除这些商品`);Modal.confirm({title:`删除空分类“${category.name||'未命名分类'}”？`,content:'保存分类设置后生效。',okText:'确认删除',okType:'danger',cancelText:'取消',onOk(){parent.children.splice(index,1)}})}
async function saveCategories(){const names=categoryDrafts.value.map(item=>item.name.trim());if(names.some(name=>!name))return message.warning('一级分类名称不能为空');if(new Set(names).size!==names.length)return message.warning('一级分类名称不能重复');for(const category of categoryDrafts.value){const childNames=category.children.map(item=>item.name.trim());if(childNames.some(name=>!name))return message.warning(`分类“${category.name}”下有未填写名称的二级分类`);if(new Set(childNames).size!==childNames.length)return message.warning(`分类“${category.name}”下的二级分类名称不能重复`)}savingCategories.value=true;try{await post('/api/admin/mall/categories/save',{categories:categoryDrafts.value});message.success('商品分类已保存');categoryOpen.value=false;await load()}catch(e){message.error(errorMessage(e))}finally{savingCategories.value=false}}
onMounted(load)
</script>

<style scoped>
.product-cell{display:flex;align-items:center;gap:12px;min-width:0}.product-cell>img,.product-image-empty{width:62px;height:62px;flex:0 0 62px;border-radius:12px;object-fit:cover}.product-image-empty{display:grid;place-items:center;color:#9cabaa;background:#edf2ef}.product-cell>div:last-child{display:flex;min-width:0;flex-direction:column}.product-cell b,.product-cell small{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.product-cell small,.cell-note,.sort-tip{margin-top:4px;color:#98a49f;font-size:10px}.cell-note,.original-price{display:block}.sale-price{color:#a56e2c}.original-price{margin-top:3px;color:#a4aaa7;font-size:10px;text-decoration:line-through}.product-form{display:flex;max-height:68vh;overflow:auto;padding-right:8px;flex-direction:column;gap:16px}.form-section{padding:18px;border:1px solid #e5ece9;border-radius:14px;background:#fbfcfb}.form-section__heading{display:flex;align-items:baseline;justify-content:space-between;margin-bottom:16px}.form-section__heading h3{margin:0;color:#304b42}.form-section__heading span{color:#97a39e;font-size:10px}.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}.form-grid.four{grid-template-columns:repeat(4,1fr)}.image-row{display:grid;grid-template-columns:58px minmax(0,1fr) 36px;align-items:center;gap:10px;margin-bottom:12px}.image-row>span{color:#7d8c86;font-size:10px}.category-intro{display:flex;align-items:center;gap:12px;margin-bottom:12px;padding:13px 15px;border-radius:12px;color:#376859;background:#edf5f2}.category-intro>span{display:flex;flex-direction:column}.category-intro small{margin-top:3px;color:#81938d;font-size:10px}.category-editor{display:flex;max-height:390px;overflow:auto;flex-direction:column;gap:8px}.category-row{display:grid;grid-template-columns:34px minmax(180px,1fr) 90px 34px 34px 34px;align-items:center;gap:8px;padding:9px;border:1px solid #e7eeeb;border-radius:11px;background:#fbfcfb}.category-row>:deep(.ant-btn){display:inline-flex;width:34px;height:34px;align-items:center;justify-content:center;padding:0}.category-index{color:#739087;text-align:center}.category-usage{color:#94a19c;font-size:10px;text-align:center}.category-add{margin-top:12px}.category-parent-select{width:240px;margin-bottom:12px}.category-actions{display:flex;justify-content:flex-end;gap:10px;margin-top:18px;padding-top:14px;border-top:1px solid #edf1ef}@media(max-width:760px){.form-grid,.form-grid.four{grid-template-columns:1fr}.image-row{grid-template-columns:1fr}.image-row>span{font-weight:700}.category-row{grid-template-columns:30px 1fr repeat(3,34px)}.category-usage{display:none}}
</style>
