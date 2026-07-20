<template>
  <div class="page-shell">
    <PageHeader :title="aftersales ? '售后管理' : '订单管理'" :description="aftersales ? '集中处理退款申请与用户沟通' : '追踪订单状态，完成发货与履约管理'">
      <a-input-search v-model:value="keyword" allow-clear placeholder="订单号 / 用户 / 收件人" style="width:270px" @search="search" />
      <a-button v-if="!aftersales" danger :loading="cleaning" @click="cleanup"><ClearOutlined /> 清理超时订单</a-button>
      <a-button :loading="loading" @click="load"><ReloadOutlined /> 刷新</a-button>
    </PageHeader>

    <div v-if="!aftersales" class="status-filter">
      <button v-for="item in filters" :key="item.value" :class="{active:status===item.value}" @click="setStatus(item.value)"><span :style="{background:item.dot}"></span>{{ item.label }}</button>
    </div>

    <a-card class="surface-card" :bordered="false">
      <a-table row-key="id" :columns="columns" :data-source="orders" :loading="loading" :pagination="pagination" :scroll="{x:1300}" @change="onTableChange">
        <template #bodyCell="{column,record}">
          <template v-if="column.key==='order'"><a class="order-link mono" @click="openDetail(record)">{{ record.order_no }}</a><div class="muted">ID {{ record.id }}</div></template>
          <template v-else-if="column.key==='user'"><div class="table-user"><a-avatar>{{ (record.user?.nickname||record.user?.username||'用').slice(0,1) }}</a-avatar><div><b>{{ record.user?.nickname||record.user?.username||`用户 ${record.user_id}` }}</b><div class="muted mono">UID {{ record.user_id }}</div></div></div></template>
          <template v-else-if="column.key==='receiver'"><b>{{ record.consignee||'—' }}</b><div class="muted mono">{{ record.phone||'—' }}</div></template>
          <template v-else-if="column.key==='design'"><b>{{ record.design_name||'已删除的设计' }}</b><div class="muted">{{ (record.bead_details||record.pattern||[]).length }} 颗珠子</div></template>
          <template v-else-if="column.key==='total'"><span class="money">{{ money(record.total_price) }}</span></template>
          <template v-else-if="column.key==='status'"><StatusTag :status="record.status" :map="orderStatus" /><div v-if="record.status==='refund'" class="refund-sub">{{ refundMap[record.refund_status]?.text||'处理中' }}</div></template>
          <template v-else-if="column.key==='created_at'">{{ dateTime(record.created_at) }}</template>
          <template v-else-if="column.key==='action'"><a-space><a-button type="link" size="small" @click="openDetail(record)">查看详情</a-button><a-button v-if="record.status==='paid'" type="link" size="small" @click="openShip(record)">发货</a-button><a-dropdown><a-button type="text" size="small"><MoreOutlined /></a-button><template #overlay><a-menu><a-menu-item v-for="next in nextStatuses(record.status)" :key="next" @click="changeStatus(record,next)">设为{{ orderStatus[next]?.text }}</a-menu-item><a-menu-divider/><a-menu-item danger @click="remove(record)">删除订单</a-menu-item></a-menu></template></a-dropdown></a-space></template>
        </template>
        <template #emptyText><a-empty :description="aftersales ? '暂无售后申请' : '没有匹配的订单'" /></template>
      </a-table>
    </a-card>

    <a-drawer v-model:open="detailOpen" title="订单详情" placement="right" :width="760" @after-open-change="drawerChanged">
      <template #extra><StatusTag v-if="selected" :status="selected.status" :map="orderStatus" /></template>
      <div v-if="selected" class="detail-stack">
        <div class="detail-hero"><div><span class="muted">订单编号</span><h2 class="mono">{{ selected.order_no }}</h2><div class="muted">创建于 {{ dateTime(selected.created_at) }}</div></div><span class="hero-money">{{ money(selected.total_price) }}</span></div>

        <a-descriptions title="收货与支付" bordered :column="2" size="small">
          <a-descriptions-item label="下单用户">{{ selected.user?.nickname||selected.user?.username||`用户 ${selected.user_id}` }}</a-descriptions-item>
          <a-descriptions-item label="收件人">{{ selected.consignee||'—' }}</a-descriptions-item>
          <a-descriptions-item label="联系电话">{{ selected.phone||'—' }}</a-descriptions-item>
          <a-descriptions-item label="支付方式">{{ payType(selected.pay_type) }}</a-descriptions-item>
          <a-descriptions-item label="收货地址" :span="2">{{ selected.address||'—' }}</a-descriptions-item>
          <a-descriptions-item label="交易流水" :span="2"><span class="mono">{{ selected.trade_no||'—' }}</span></a-descriptions-item>
          <a-descriptions-item label="买家备注" :span="2">{{ selected.remark||'—' }}</a-descriptions-item>
        </a-descriptions>

        <section class="design-panel">
          <BraceletPreview :pattern="selected.pattern" :material-map="materialMap" :size="210" @select="showBead" />
          <div class="design-copy"><span class="eyebrow">DESIGN DETAILS</span><h3>{{ selected.design_name||'已删除的设计' }}</h3><p>{{ selected.mode==='necklace'?'项链':'手链' }} · {{ (selected.bead_details||[]).length }} 颗珠子</p><div class="chips"><span>制作：{{ selected.production_method||'未选择' }}</span><span>包装：{{ selected.packaging_method||'未选择' }}</span><span>配送：{{ selected.express_method||'未选择' }}</span><span>绳色：{{ selected.rope_color||'默认' }}</span></div></div>
        </section>

        <a-descriptions v-if="selected.express_no||selected.status==='shipped'||selected.status==='completed'" title="物流信息" bordered :column="2" size="small"><a-descriptions-item label="快递公司">{{ selected.express_company||'—' }}</a-descriptions-item><a-descriptions-item label="快递单号">{{ selected.express_no||'—' }}</a-descriptions-item><a-descriptions-item label="发货时间" :span="2">{{ dateTime(selected.ship_time) }}</a-descriptions-item></a-descriptions>

        <section v-if="selected.status==='refund'" class="aftersale-panel">
          <div class="section-heading"><div><h3>售后处理</h3><p>{{ selected.refund_reason||'用户未填写售后原因' }}</p></div><a-tag :color="refundMap[selected.refund_status]?.color||'gold'">{{ refundMap[selected.refund_status]?.text||'处理中' }}</a-tag></div>
          <a-alert v-if="selected.refund_return_address" type="info" show-icon :message="`退货地址：${selected.refund_return_address}`" />
          <div class="review-actions"><a-button v-if="selected.refund_status==='pending'" type="primary" @click="openReview('approve')">通过申请</a-button><a-button v-if="selected.refund_status==='pending'" danger @click="openReview('reject')">拒绝申请</a-button><a-button v-if="selected.refund_status==='approved'" type="primary" @click="openReview('done')">确认处理完成</a-button></div>

          <div class="chat-title"><span>售后沟通</span><a-badge status="processing" text="自动刷新" /></div>
          <div class="chat-box">
            <a-empty v-if="!messages.length" :image="false" description="暂无沟通消息" />
            <div v-for="msg in messages" :key="msg.id" class="chat-message" :class="msg.sender==='admin'?'mine':'theirs'"><span>{{ msg.sender==='admin'?'客服':'用户' }}</span><div><p v-if="msg.content">{{ msg.content }}</p><a-image-preview-group v-if="msg.images?.length"><div class="message-images"><a-image v-for="image in msg.images" :key="image" :src="resolveMedia(image)" :width="72" :height="72" /></div></a-image-preview-group><small>{{ dateTime(msg.created_at) }}</small></div></div>
          </div>
          <div v-if="pendingImages.length" class="pending-images"><div v-for="(image,index) in pendingImages" :key="image"><img :src="resolveMedia(image)"/><button @click="pendingImages.splice(index,1)">×</button></div></div>
          <div class="chat-input"><a-textarea v-model:value="chatText" :auto-size="{minRows:2,maxRows:4}" placeholder="输入回复内容，Ctrl + Enter 发送" @keydown.ctrl.enter.prevent="sendMessage"/><a-upload :show-upload-list="false" accept="image/*" :custom-request="uploadChatImage"><a-button :loading="uploadingChat"><PictureOutlined /></a-button></a-upload><a-button type="primary" :loading="sending" @click="sendMessage"><SendOutlined /> 发送</a-button></div>
        </section>
      </div>
      <template #footer><div class="drawer-footer"><a-button danger @click="remove(selected)">删除订单</a-button><div><a-button v-if="selected?.status==='paid'" type="primary" @click="openShip(selected)">填写物流并发货</a-button></div></div></template>
    </a-drawer>

    <a-modal v-model:open="shipOpen" title="订单发货" ok-text="确认发货" :confirm-loading="saving" @ok="ship"><a-alert type="info" show-icon :message="`订单 ${selected?.order_no || ''}`" class="modal-alert"/><a-form layout="vertical"><a-form-item label="快递公司" required><a-select v-model:value="shipForm.company" show-search :options="expressOptions" placeholder="请选择或搜索快递公司" /></a-form-item><a-form-item label="快递单号" required><a-input v-model:value="shipForm.no" placeholder="请输入快递单号" /></a-form-item></a-form></a-modal>
    <a-modal v-model:open="reviewOpen" :title="reviewTitle" ok-text="确认提交" :ok-button-props="{danger:reviewAction==='reject'}" :confirm-loading="saving" @ok="review"><a-form layout="vertical"><a-form-item :label="reviewAction==='reject'?'拒绝原因':'处理备注'" :required="reviewAction==='reject'"><a-textarea v-model:value="reviewRemark" :rows="4" maxlength="300" show-count /></a-form-item></a-form></a-modal>
    <a-modal v-model:open="beadOpen" title="珠材详情" :footer="null"><a-descriptions v-if="selectedBead" bordered :column="2" size="small"><a-descriptions-item label="名称">{{ selectedBead.name||'—' }}</a-descriptions-item><a-descriptions-item label="珠子 ID">{{ selectedBead.id||'—' }}</a-descriptions-item><a-descriptions-item label="尺寸">{{ selectedBead.size||'—' }}</a-descriptions-item><a-descriptions-item label="颜色">{{ selectedBead.color||selectedBead.color_family||'—' }}</a-descriptions-item><a-descriptions-item label="分类">{{ selectedBead.category||'—' }}</a-descriptions-item><a-descriptions-item label="材质">{{ selectedBead.type||'—' }}</a-descriptions-item></a-descriptions></a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed,onBeforeUnmount,onMounted,reactive,ref,watch } from 'vue'
import { message,Modal } from 'ant-design-vue'
import { ClearOutlined,MoreOutlined,PictureOutlined,ReloadOutlined,SendOutlined } from '@ant-design/icons-vue'
import PageHeader from '@/components/PageHeader.vue'
import StatusTag from '@/components/StatusTag.vue'
import BraceletPreview from '@/components/BraceletPreview.vue'
import { errorMessage,get,post,uploadImage } from '@/api/http'
import { dateTime,listFrom,money,orderStatus,resolveMedia,totalFrom } from '@/utils/format'

const props=withDefaults(defineProps<{aftersales?:boolean}>(),{aftersales:false})
const columns=[{title:'订单',key:'order',width:190},{title:'用户',key:'user',width:190},{title:'收货人',key:'receiver',width:170},{title:'设计',key:'design',width:200},{title:'金额',key:'total',width:110},{title:'状态',key:'status',width:110},{title:'创建时间',key:'created_at',width:165},{title:'操作',key:'action',width:190,fixed:'right' as const}]
const filters=[{label:'全部订单',value:'',dot:'#779087'},{label:'待付款',value:'pending',dot:'#d89b43'},{label:'待发货',value:'paid',dot:'#bf7e26'},{label:'已发货',value:'shipped',dot:'#4b7cae'},{label:'已完成',value:'completed',dot:'#3f8b6c'},{label:'已取消',value:'cancelled',dot:'#9ca7a2'},{label:'售后中',value:'refund',dot:'#c55b54'}]
const refundMap:any={pending:{text:'处理中',color:'gold'},approved:{text:'待退回',color:'blue'},rejected:{text:'已拒绝',color:'red'},done:{text:'已完成',color:'green'},cancelled:{text:'已撤回',color:'default'}}
const expressOptions=['顺丰速运','韵达快递','中通快递','圆通速递','申通快递','京东物流','邮政 EMS','极兔速递'].map(value=>({label:value,value}))
const loading=ref(false),saving=ref(false),cleaning=ref(false),orders=ref<any[]>([]),keyword=ref(''),status=ref(props.aftersales?'refund':''),page=ref(1),pageSize=ref(20),total=ref(0)
const selected=ref<any>(),detailOpen=ref(false),shipOpen=ref(false),reviewOpen=ref(false),beadOpen=ref(false),selectedBead=ref<any>()
const shipForm=reactive({company:'',no:''}),reviewAction=ref<'approve'|'reject'|'done'>('approve'),reviewRemark=ref('')
const messages=ref<any[]>([]),chatText=ref(''),pendingImages=ref<string[]>([]),sending=ref(false),uploadingChat=ref(false)
let messageTimer:number|undefined
const pagination=computed(()=>({current:page.value,pageSize:pageSize.value,total:total.value,showSizeChanger:true,showTotal:(n:number)=>`共 ${n} 笔订单`}))
const materialMap=computed(()=>Object.fromEntries((selected.value?.bead_details||[]).flatMap((bead:any)=>[[String(bead.id),bead],[`dynamic_${bead.id}`,bead]])))
const reviewTitle=computed(()=>reviewAction.value==='approve'?'通过售后申请':reviewAction.value==='reject'?'拒绝售后申请':'确认售后处理完成')

async function load(){loading.value=true;try{const data:any=await get('/api/order/list',{page:page.value,pageSize:pageSize.value,status:status.value,keyword:keyword.value.trim(),admin:true});orders.value=listFrom(data);total.value=totalFrom(data,orders.value.length)}catch(e){message.error(errorMessage(e))}finally{loading.value=false}}
function search(){page.value=1;void load()} function setStatus(value:string){status.value=value;page.value=1;void load()} function onTableChange(p:any){page.value=p.current;pageSize.value=p.pageSize;void load()}
function openDetail(row:any){selected.value=row;detailOpen.value=true}
function openShip(row:any){selected.value=row;shipForm.company=row.express_company||'';shipForm.no=row.express_no||'';shipOpen.value=true}
function nextStatuses(current:string){const flow:any={pending:['paid','cancelled'],paid:['shipped','refund'],shipped:['completed','refund'],completed:['refund']};return flow[current]||[]}
function payType(value:string){return ({balance:'余额支付',wxpay:'微信支付',creem:'Creem 支付'} as any)[value]||value||'未支付'}
function showBead(bead:any){selectedBead.value=bead;beadOpen.value=true}
async function changeStatus(row:any,next:string){Modal.confirm({title:`将订单状态改为“${orderStatus[next]?.text}”？`,content:'状态变更会影响用户端订单流程。',okText:'确认变更',cancelText:'取消',async onOk(){try{await post('/api/order/update_status',{id:row.id,status:next});message.success('订单状态已更新');await load()}catch(e){message.error(errorMessage(e))}}})}
async function ship(){if(!shipForm.company||!shipForm.no.trim())return message.warning('请完整填写快递公司和快递单号');saving.value=true;try{await post('/api/order/ship',{order_id:selected.value.id,express_company:shipForm.company,express_no:shipForm.no.trim()});message.success('订单已发货');shipOpen.value=false;detailOpen.value=false;await load()}catch(e){message.error(errorMessage(e))}finally{saving.value=false}}
function remove(row:any){Modal.confirm({title:`删除订单 ${row.order_no}？`,content:'订单删除后不可恢复，请确认该订单不再需要保留。',okText:'确认删除',okType:'danger',cancelText:'取消',async onOk(){try{await post('/api/order/delete',{id:row.id});message.success('订单已删除');detailOpen.value=false;await load()}catch(e){message.error(errorMessage(e))}}})}
function cleanup(){Modal.confirm({title:'清理超时未支付订单？',content:'将永久删除超过 30 分钟仍未付款的订单。',okText:'确认清理',okType:'danger',cancelText:'取消',async onOk(){cleaning.value=true;try{const result:any=await post('/api/order/cleanup',{minutes:30});message.success(`已清理 ${result?.deleted_count||0} 笔超时订单`);await load()}catch(e){message.error(errorMessage(e))}finally{cleaning.value=false}}})}
function openReview(action:'approve'|'reject'|'done'){reviewAction.value=action;reviewRemark.value='';reviewOpen.value=true}
async function review(){if(reviewAction.value==='reject'&&!reviewRemark.value.trim())return message.warning('请填写拒绝原因');saving.value=true;try{await post('/api/order/refund_review',{order_id:selected.value.id,action:reviewAction.value,remark:reviewRemark.value.trim()});message.success('售后状态已更新');reviewOpen.value=false;detailOpen.value=false;await load()}catch(e){message.error(errorMessage(e))}finally{saving.value=false}}
async function loadMessages(){if(!selected.value?.id||selected.value.status!=='refund')return;try{const data:any=await get('/api/order/refund_message_list',{order_id:selected.value.id});messages.value=listFrom(data,['messages'])}catch(e){message.error(errorMessage(e))}}
function drawerChanged(open:boolean){if(open&&selected.value?.status==='refund'){void loadMessages();messageTimer=window.setInterval(loadMessages,8000)}else if(messageTimer){clearInterval(messageTimer);messageTimer=undefined}}
async function uploadChatImage(options:any){uploadingChat.value=true;try{const result=await uploadImage(options.file as File);pendingImages.value.push(result.url);options.onSuccess?.(result)}catch(e){message.error(errorMessage(e));options.onError?.(e as Error)}finally{uploadingChat.value=false}}
async function sendMessage(){if(!chatText.value.trim()&&!pendingImages.value.length)return message.warning('请输入消息或上传图片');sending.value=true;try{await post('/api/order/refund_message_send',{order_id:selected.value.id,content:chatText.value.trim(),images:[...pendingImages.value]});chatText.value='';pendingImages.value=[];await loadMessages()}catch(e){message.error(errorMessage(e))}finally{sending.value=false}}
watch(()=>props.aftersales,(value)=>{status.value=value?'refund':'';page.value=1;void load()})
onMounted(load);onBeforeUnmount(()=>messageTimer&&clearInterval(messageTimer))
</script>

<style scoped>
.status-filter{display:flex;gap:8px;overflow:auto;padding:4px}.status-filter button{display:flex;align-items:center;gap:8px;flex:0 0 auto;padding:9px 14px;border:1px solid #e0e8e4;border-radius:99px;color:#6c7d77;background:#fff;cursor:pointer}.status-filter button span{width:7px;height:7px;border-radius:50%}.status-filter button.active{border-color:#2c705d;color:#245b4c;background:#eaf3ef;box-shadow:0 4px 12px rgba(31,104,84,.08)}.order-link{font-weight:700}.refund-sub{margin-top:4px;color:#9d615d;font-size:10px}.detail-stack{display:flex;flex-direction:column;gap:24px}.detail-hero{display:flex;align-items:flex-start;justify-content:space-between;padding:20px;border-radius:16px;color:#eaf4ef;background:linear-gradient(135deg,#173f35,#286d5a)}.detail-hero .muted{color:rgba(255,255,255,.58)}.detail-hero h2{margin:6px 0;color:white;font-size:18px}.hero-money{font:700 28px Georgia,serif;color:#ecd9a9}.design-panel{display:flex;align-items:center;gap:28px;padding:18px;border:1px solid #e5ece9;border-radius:16px;background:#fafcfa}.design-copy{flex:1}.design-copy .eyebrow{color:#a28656;font-size:10px;letter-spacing:.16em}.design-copy h3{margin:8px 0 4px;color:#26493e;font:700 22px Georgia,'Noto Serif SC',serif}.design-copy p{color:#84918c}.chips{display:flex;flex-wrap:wrap;gap:7px}.chips span{padding:6px 9px;border-radius:7px;color:#62746e;background:#edf3f0;font-size:11px}.aftersale-panel{padding:18px;border:1px solid #f0ddda;border-radius:16px;background:#fffaf9}.section-heading{display:flex;justify-content:space-between;gap:15px}.section-heading h3{margin:0}.section-heading p{color:#7f716f}.review-actions{display:flex;gap:8px;margin:16px 0}.chat-title{display:flex;align-items:center;justify-content:space-between;margin:22px 0 10px;font-weight:700}.chat-box{max-height:360px;overflow:auto;padding:14px;border:1px solid #ece7e6;border-radius:12px;background:#f9f8f7}.chat-message{display:flex;gap:8px;margin:12px 0}.chat-message>span{color:#9b8e8a;font-size:10px}.chat-message>div{max-width:78%;padding:9px 11px;border-radius:4px 13px 13px 13px;background:#fff;box-shadow:0 3px 10px rgba(60,45,42,.05)}.chat-message.mine{flex-direction:row-reverse}.chat-message.mine>div{border-radius:13px 4px 13px 13px;color:#fff;background:#286c59}.chat-message p{margin:0 0 4px;white-space:pre-wrap}.chat-message small{opacity:.58;font-size:9px}.message-images{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0}.pending-images{display:flex;gap:8px;margin-top:10px}.pending-images>div{position:relative}.pending-images img{width:58px;height:58px;border-radius:8px;object-fit:cover}.pending-images button{position:absolute;right:-5px;top:-5px;width:18px;height:18px;padding:0;border:0;border-radius:50%;color:white;background:#c55b54;cursor:pointer}.chat-input{display:grid;grid-template-columns:1fr auto auto;align-items:end;gap:8px;margin-top:10px}.drawer-footer{display:flex;justify-content:space-between}.modal-alert{margin-bottom:18px}
@media(max-width:650px){.design-panel{flex-direction:column}.detail-hero{flex-direction:column;gap:18px}.chat-input{grid-template-columns:1fr auto}.chat-input>textarea{grid-column:1/-1}}
</style>
