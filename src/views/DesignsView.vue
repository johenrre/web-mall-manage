<template>
  <div class="page-shell">
    <PageHeader title="设计管理" description="审核用户投稿，维护灵感广场的作品质量">
      <a-input-search v-model:value="keyword" allow-clear placeholder="作品名 / 用户 / ID" style="width:250px" @search="search" />
      <a-button :loading="loading" @click="load"><ReloadOutlined /> 刷新</a-button>
    </PageHeader>
    <a-card class="filter-card surface-card" :bordered="false">
      <div class="toolbar"><span class="filter-label">作品类型</span><a-segmented v-model:value="type" :options="typeOptions" @change="search"/><a-divider type="vertical"/><span class="filter-label">审核状态</span><a-select v-model:value="status" :options="statusOptions" style="width:130px" @change="search"/></div>
    </a-card>
    <a-card class="surface-card" :bordered="false">
      <a-table row-key="id" :columns="columns" :data-source="designs" :loading="loading" :pagination="pagination" :scroll="{x:1280}" @change="onTableChange">
        <template #bodyCell="{column,record}">
          <template v-if="column.key==='design'"><div class="design-cell"><button class="preview-button" @click="openPreview(record)"><BraceletPreview :pattern="record.pattern" :material-map="record.material_map||record.materialMap" :size="76"/></button><div><b>{{ record.name||'未命名作品' }}</b><div class="muted mono">#{{ record.id }}</div></div></div></template>
          <template v-else-if="column.key==='author'"><b>{{ record.nickname||`用户 ${record.user_id}` }}</b><div class="muted mono">UID {{ record.user_id }}</div></template>
          <template v-else-if="column.key==='price'"><span class="money">{{ money(record.price) }}</span><div class="muted">{{ record.bead_count||0 }} 颗</div></template>
          <template v-else-if="column.key==='photos'"><a-avatar-group :max-count="3"><a-avatar v-for="photo in photoList(record)" :key="photo" shape="square" :src="resolveMedia(photo)"/></a-avatar-group><span v-if="!photoList(record).length" class="muted">暂无实拍</span></template>
          <template v-else-if="column.key==='status'"><StatusTag :status="record.inspiration_status" :map="designStatusMap"/><div class="muted type-label">{{ typeLabel(record.inspiration_type) }}</div></template>
          <template v-else-if="column.key==='created_at'">{{ dateTime(record.inspiration_submitted_at||record.created_at) }}</template>
          <template v-else-if="column.key==='action'"><a-space wrap><a-dropdown><a-button type="primary" size="small">审核 <DownOutlined/></a-button><template #overlay><a-menu><a-menu-item @click="openReview(record,'approve','customer')">设为优秀客订</a-menu-item><a-menu-item @click="openReview(record,'approve','designer')">设为设计师作品</a-menu-item><a-menu-divider/><a-menu-item danger @click="openReview(record,'reject',record.inspiration_type||'customer')">拒绝 / 下架</a-menu-item></a-menu></template></a-dropdown><a-button size="small" @click="openPhotos(record)">实拍图</a-button></a-space></template>
        </template>
      </a-table>
    </a-card>

    <a-modal v-model:open="previewOpen" title="作品设计预览" :footer="null" :width="520"><div v-if="selected" class="large-preview"><BraceletPreview :pattern="selected.pattern" :material-map="selected.material_map||selected.materialMap" :size="340"/><h2>{{ selected.name }}</h2><p>{{ selected.nickname }} · {{ selected.bead_count }} 颗珠子 · {{ money(selected.price) }}</p></div></a-modal>
    <a-modal v-model:open="reviewOpen" :title="reviewForm.action==='reject'?'拒绝或下架作品':'通过作品审核'" ok-text="确认提交" :ok-button-props="{danger:reviewForm.action==='reject'}" :confirm-loading="saving" @ok="review">
      <a-alert :type="reviewForm.action==='reject'?'warning':'success'" show-icon class="modal-alert" :message="selected?.name"/>
      <a-form layout="vertical"><a-form-item v-if="reviewForm.action==='approve'" label="展示类型"><a-radio-group v-model:value="reviewForm.type"><a-radio-button value="customer">优秀客订</a-radio-button><a-radio-button value="designer">设计师作品</a-radio-button></a-radio-group></a-form-item><a-form-item :label="reviewForm.action==='reject'?'拒绝/下架原因':'审核备注'"><a-textarea v-model:value="reviewForm.reason" :rows="4" maxlength="300" show-count/></a-form-item></a-form>
    </a-modal>
    <a-modal v-model:open="photosOpen" title="维护作品实拍图" :width="680" ok-text="保存实拍图" :confirm-loading="saving" @ok="savePhotos">
      <a-upload-dragger :show-upload-list="false" accept="image/*" :custom-request="uploadPhoto" multiple><p class="ant-upload-drag-icon"><InboxOutlined/></p><p class="ant-upload-text">拖拽或点击上传实拍图</p><p class="ant-upload-hint">每张不超过 5 MB，最多保留 12 张</p></a-upload-dragger>
      <div v-if="photoDraft.length" class="photo-grid"><div v-for="(photo,index) in photoDraft" :key="photo"><a-image :src="resolveMedia(photo)"/><button @click="photoDraft.splice(index,1)"><DeleteOutlined/></button></div></div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed,onMounted,reactive,ref } from 'vue'
import { message } from 'ant-design-vue'
import { DeleteOutlined,DownOutlined,InboxOutlined,ReloadOutlined } from '@ant-design/icons-vue'
import PageHeader from '@/components/PageHeader.vue'
import BraceletPreview from '@/components/BraceletPreview.vue'
import StatusTag from '@/components/StatusTag.vue'
import { errorMessage,get,post,uploadImage } from '@/api/http'
import { dateTime,listFrom,money,resolveMedia,totalFrom } from '@/utils/format'
const designStatusMap:any={pending:{text:'待处理',color:'gold'},approved:{text:'已展示',color:'green'},rejected:{text:'已下架',color:'red'},private:{text:'未发布',color:'default'}}
const typeOptions=[{label:'全部',value:'all'},{label:'设计师作品',value:'designer'},{label:'优秀客订',value:'customer'}],statusOptions=[{label:'已展示',value:'approved'},{label:'待处理',value:'pending'},{label:'已下架',value:'rejected'},{label:'未发布',value:'private'},{label:'全部',value:'all'}]
const columns=[{title:'作品',key:'design',width:250},{title:'作者',key:'author',width:150},{title:'价格 / 珠数',key:'price',width:120},{title:'实拍图',key:'photos',width:150},{title:'状态 / 类型',key:'status',width:140},{title:'提交时间',key:'created_at',width:170},{title:'操作',key:'action',width:210,fixed:'right' as const}]
const loading=ref(false),saving=ref(false),designs=ref<any[]>([]),keyword=ref(''),type=ref('all'),status=ref('approved'),page=ref(1),pageSize=ref(20),total=ref(0),selected=ref<any>()
const previewOpen=ref(false),reviewOpen=ref(false),photosOpen=ref(false),photoDraft=ref<string[]>([]),reviewForm=reactive({action:'approve',type:'customer',reason:''})
const pagination=computed(()=>({current:page.value,pageSize:pageSize.value,total:total.value,showSizeChanger:true,showTotal:(n:number)=>`共 ${n} 个作品`}))
function photoList(record:any):string[]{const value=record.live_photos||record.productPhotos||[];if(Array.isArray(value))return value;try{return JSON.parse(value||'[]')}catch{return[]}}
function typeLabel(value:string){return value==='designer'?'设计师作品':value==='customer'?'优秀客订':'未分类'}
async function load(){loading.value=true;try{const data:any=await get('/api/admin/design_list',{keyword:keyword.value.trim(),type:type.value,status:status.value,page:page.value,page_size:pageSize.value});designs.value=listFrom(data);total.value=totalFrom(data,designs.value.length)}catch(e){message.error(errorMessage(e))}finally{loading.value=false}}
function search(){page.value=1;void load()}function onTableChange(p:any){page.value=p.current;pageSize.value=p.pageSize;void load()}function openPreview(row:any){selected.value=row;previewOpen.value=true}
function openReview(row:any,action:string,nextType:string){selected.value=row;Object.assign(reviewForm,{action,type:nextType,reason:''});reviewOpen.value=true}
async function review(){saving.value=true;try{await post('/api/admin/design_review',{id:selected.value.id,...reviewForm});message.success(reviewForm.action==='reject'?'作品已下架':'作品已通过审核');reviewOpen.value=false;await load()}catch(e){message.error(errorMessage(e))}finally{saving.value=false}}
function openPhotos(row:any){selected.value=row;photoDraft.value=[...photoList(row)];photosOpen.value=true}
async function uploadPhoto(options:any){if(photoDraft.value.length>=12){message.warning('最多上传 12 张实拍图');return}try{const result=await uploadImage(options.file as File);photoDraft.value.push(result.url);options.onSuccess?.(result)}catch(e){message.error(errorMessage(e));options.onError?.(e as Error)}}
async function savePhotos(){saving.value=true;try{await post('/api/admin/design_live_photos',{id:selected.value.id,livePhotos:photoDraft.value});message.success('实拍图已保存');photosOpen.value=false;await load()}catch(e){message.error(errorMessage(e))}finally{saving.value=false}}
onMounted(load)
</script>

<style scoped>
.filter-card :deep(.ant-card-body){padding:14px 18px}.filter-label{color:#7c8a85;font-size:12px}.design-cell{display:flex;align-items:center;gap:13px}.preview-button{padding:0;border:1px solid #e5ebe8;border-radius:50%;background:#f8faf9;cursor:pointer}.type-label{margin-top:4px;font-size:10px}.large-preview{display:flex;flex-direction:column;align-items:center;padding:10px}.large-preview h2{margin:8px 0 0;color:#24483d;font:700 24px Georgia,'Noto Serif SC',serif}.large-preview p{color:#81908a}.modal-alert{margin-bottom:18px}.photo-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:18px}.photo-grid>div{position:relative;aspect-ratio:1}.photo-grid :deep(.ant-image),.photo-grid :deep(img){width:100%!important;height:100%!important;border-radius:10px;object-fit:cover}.photo-grid button{position:absolute;right:6px;top:6px;width:28px;height:28px;border:0;border-radius:8px;color:white;background:rgba(139,50,45,.85);cursor:pointer}
</style>
