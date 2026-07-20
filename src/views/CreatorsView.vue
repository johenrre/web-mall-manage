<template>
  <div class="page-shell">
    <PageHeader title="设计师管理" description="审核设计师入驻申请与设计师投稿作品">
      <a-button :loading="loading" @click="load"><ReloadOutlined /> 刷新</a-button>
    </PageHeader>
    <a-alert v-if="apiUnavailable" type="warning" show-icon closable message="当前 Node 后端尚未提供设计师审核接口" description="页面已按需求完成，接口补齐后即可直接启用审核流程。" />
    <a-card class="surface-card" :bordered="false">
      <a-tabs v-model:active-key="tab" @change="load">
        <a-tab-pane key="applications"><template #tab><span><IdcardOutlined/> 入驻申请 <a-badge :count="pendingApplications"/></span></template>
          <a-table row-key="id" :columns="applicationColumns" :data-source="applications" :loading="loading" :scroll="{x:1100}" :pagination="{pageSize:20}">
            <template #bodyCell="{column,record}"><template v-if="column.key==='user'"><div class="table-user"><a-avatar>{{ (record.user?.nickname||record.user_id||'用').toString().slice(0,1) }}</a-avatar><b>{{ record.user?.nickname||record.user?.username||`用户 ${record.user_id}` }}</b></div></template><template v-else-if="column.key==='intro'"><a-tooltip :title="record.intro"><span class="ellipsis">{{ record.intro||'—' }}</span></a-tooltip></template><template v-else-if="column.key==='status'"><StatusTag :status="record.status" :map="reviewStatus"/></template><template v-else-if="column.key==='date'">{{ dateTime(record.applied_at) }}</template><template v-else-if="column.key==='action'"><a-space v-if="record.status==='pending'"><a-button type="primary" size="small" @click="openReview(record,'approve','application')">通过</a-button><a-button danger size="small" @click="openReview(record,'reject','application')">拒绝</a-button></a-space><span v-else class="muted">已处理</span></template></template>
          </a-table>
        </a-tab-pane>
        <a-tab-pane key="works"><template #tab><span><PictureOutlined/> 作品审核 <a-badge :count="pendingWorks"/></span></template>
          <a-table row-key="id" :columns="workColumns" :data-source="works" :loading="loading" :scroll="{x:1050}" :pagination="{pageSize:20}">
            <template #bodyCell="{column,record}"><template v-if="column.key==='work'"><div class="table-user"><a-image v-if="record.cover_image" :src="resolveMedia(record.cover_image)" :width="48" :height="48" class="cover"/><a-avatar v-else shape="square" :size="48"><PictureOutlined/></a-avatar><div><b>{{ record.title||'未命名作品' }}</b><div class="muted mono">#{{ record.id }}</div></div></div></template><template v-else-if="column.key==='user'">{{ record.user?.nickname||record.user?.username||`用户 ${record.user_id}` }}</template><template v-else-if="column.key==='description'"><a-tooltip :title="record.description"><span class="ellipsis">{{ record.description||'—' }}</span></a-tooltip></template><template v-else-if="column.key==='status'"><StatusTag :status="record.status" :map="reviewStatus"/><a-tag v-if="record.featured" color="purple" :bordered="false">精选</a-tag></template><template v-else-if="column.key==='date'">{{ dateTime(record.submitted_at) }}</template><template v-else-if="column.key==='action'"><a-space v-if="record.status==='pending'"><a-button type="primary" size="small" @click="openReview(record,'approve','work')">通过</a-button><a-button danger size="small" @click="openReview(record,'reject','work')">拒绝</a-button></a-space><span v-else class="muted">已处理</span></template></template>
          </a-table>
        </a-tab-pane>
      </a-tabs>
    </a-card>
    <a-modal v-model:open="reviewOpen" :title="reviewForm.action==='approve'?'通过审核':'拒绝审核'" ok-text="确认提交" :ok-button-props="{danger:reviewForm.action==='reject'}" :confirm-loading="saving" @ok="submitReview"><a-form layout="vertical"><a-form-item v-if="reviewForm.kind==='work'&&reviewForm.action==='approve'"><a-checkbox v-model:checked="reviewForm.featured">设为设计师精选作品</a-checkbox></a-form-item><a-form-item :label="reviewForm.action==='reject'?'拒绝原因':'审核备注'" :required="reviewForm.action==='reject'"><a-textarea v-model:value="reviewForm.reason" :rows="4" maxlength="300" show-count/></a-form-item></a-form></a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed,onMounted,reactive,ref } from 'vue'
import { message } from 'ant-design-vue'
import { IdcardOutlined,PictureOutlined,ReloadOutlined } from '@ant-design/icons-vue'
import PageHeader from '@/components/PageHeader.vue'
import StatusTag from '@/components/StatusTag.vue'
import { errorMessage,get,post } from '@/api/http'
import { dateTime,listFrom,resolveMedia,reviewStatus } from '@/utils/format'
const tab=ref('applications'),loading=ref(false),saving=ref(false),apiUnavailable=ref(false),applications=ref<any[]>([]),works=ref<any[]>([]),selected=ref<any>(),reviewOpen=ref(false)
const reviewForm=reactive({action:'approve',kind:'application',reason:'',featured:false})
const applicationColumns=[{title:'用户',key:'user',width:190},{title:'真实姓名',dataIndex:'real_name',width:130},{title:'联系方式',dataIndex:'contact',width:180},{title:'个人介绍',key:'intro',width:260},{title:'状态',key:'status',width:110},{title:'申请时间',key:'date',width:170},{title:'操作',key:'action',width:150,fixed:'right' as const}]
const workColumns=[{title:'作品',key:'work',width:230},{title:'作者',key:'user',width:150},{title:'作品说明',key:'description',width:260},{title:'状态',key:'status',width:140},{title:'提交时间',key:'date',width:170},{title:'操作',key:'action',width:150,fixed:'right' as const}]
const pendingApplications=computed(()=>applications.value.filter(x=>x.status==='pending').length),pendingWorks=computed(()=>works.value.filter(x=>x.status==='pending').length)
async function load(){loading.value=true;apiUnavailable.value=false;try{if(tab.value==='applications'){const data:any=await get('/api/admin/creator_applications_list');applications.value=listFrom(data)}else{const data:any=await get('/api/admin/creator_works_list');works.value=listFrom(data)}}catch(e:any){if(e?.status===404)apiUnavailable.value=true;else message.error(errorMessage(e))}finally{loading.value=false}}
function openReview(row:any,action:string,kind:string){selected.value=row;Object.assign(reviewForm,{action,kind,reason:'',featured:false});reviewOpen.value=true}
async function submitReview(){if(reviewForm.action==='reject'&&!reviewForm.reason.trim())return message.warning('请填写拒绝原因');saving.value=true;try{const endpoint=reviewForm.kind==='application'?'/api/admin/creator_application_review':'/api/admin/creator_work_review';await post(endpoint,{id:selected.value.id,action:reviewForm.action,reason:reviewForm.reason.trim(),featured:reviewForm.featured});message.success('审核结果已提交');reviewOpen.value=false;await load()}catch(e:any){if(e?.status===404)apiUnavailable.value=true;message.error(errorMessage(e))}finally{saving.value=false}}
onMounted(load)
</script>

<style scoped>.ellipsis{display:block;max-width:240px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.cover,:deep(.cover img){border-radius:10px;object-fit:cover}</style>
