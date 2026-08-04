<template>
  <div class="page-shell">
    <PageHeader :title="aftersales ? '售后管理' : '订单管理'" :description="aftersales ? '集中审核售后申请并处理退货退款' : '查看订单备料清单，完成制作、发货与履约'">
      <a-input-search v-model:value="keyword" allow-clear placeholder="订单号 / 用户 / 收件人 / 手机号" style="width:300px" @search="search" />
      <a-button v-if="!aftersales" :loading="syncingReceipts" @click="syncReceiptStatuses"><SyncOutlined /> 同步微信收货状态</a-button>
      <a-button v-if="!aftersales" danger :loading="cleaning" @click="cleanup"><ClearOutlined /> 关闭超时未付款订单</a-button>
      <a-button :loading="loading" @click="load"><ReloadOutlined /> 刷新</a-button>
    </PageHeader>

    <div v-if="!aftersales" class="status-filter">
      <button v-for="item in filters" :key="item.value" :class="{active:status===item.value}" @click="setStatus(item.value)"><span :style="{background:item.dot}"></span>{{ item.label }}<em>{{ filterCount(item.value) }}</em></button>
    </div>

    <a-spin :spinning="loading">
      <div v-if="orders.length" class="order-list">
        <article v-for="record in orders" :key="record.id" class="order-card" :class="`is-${record.status}`">
          <header class="order-card__header">
            <div class="order-identity"><a class="order-link mono" @click="openDetail(record)">{{ record.order_no }}</a><span>ID {{ record.id }}</span><span>{{ dateTime(record.created_at) }}</span></div>
            <div class="order-state"><a-tag v-if="record.status==='refund'" :color="refundMap[record.refund_status]?.color||'gold'">{{ refundMap[record.refund_status]?.text||'处理中' }}</a-tag><template v-else><StatusTag :status="record.status" :map="orderStatus" /><a-tag v-if="record.refund_status==='rejected'" color="red">售后已拒绝</a-tag></template></div>
          </header>

          <div class="order-card__body">
            <section class="card-products">
              <span class="block-label">商品明细 · {{ itemsOf(record).length }} 种 / {{ totalItemQuantity(record) }} 件</span>
              <div v-for="item in itemsOf(record).slice(0,2)" :key="`${item.item_type}:${item.ref_id}`" class="card-product-mini">
                <div class="card-product-mini__preview">
                  <BraceletPreview v-if="isDiyItem(item)" :pattern="itemPattern(item)" :material-map="itemMaterialMap(item)" :size="54" />
                  <img v-else-if="item.cover_image" :src="resolveMedia(item.cover_image)" />
                  <span v-else>{{ isDiyItem(item)?'DIY':'商' }}</span>
                </div>
                <div><h3>{{ item.title||'未命名商品' }}</h3><p>{{ itemTypeLabel(item) }} · {{ money(item.unit_price) }} × {{ item.quantity||1 }}</p></div>
              </div>
              <small v-if="itemsOf(record).length>2">另有 {{ itemsOf(record).length-2 }} 种商品，打开详情查看</small>
            </section>

            <section class="card-info"><span class="block-label">收件信息</span><h4>{{ record.consignee||'未填写' }} <small class="mono">{{ record.phone||'—' }}</small></h4><p :title="record.address">{{ record.address||'未填写收货地址' }}</p><small>下单用户：{{ record.user?.nickname||record.user?.username||`用户 ${record.user_id}` }}</small></section>

            <section class="card-fulfillment"><span class="block-label">制作与配送</span><p><i>制作</i>{{ optionText('production',record.production_method) }}</p><p><i>包装</i>{{ optionText('packaging',record.packaging_method) }}</p><p><i>绳线</i>{{ record.rope_color||'默认' }}</p><p><i>配送</i>{{ optionText('express',record.express_method) }}</p></section>

            <section class="card-settlement">
              <span class="block-label">订单金额</span>
              <strong>{{ money(record.total_price) }}</strong>
              <div class="card-actions">
                <a-button v-if="record.status==='paid'" type="primary" block @click="openShip(record)">填写发货</a-button>
                <div class="card-actions__secondary">
                  <a-button block @click="openDetail(record)">查看详情</a-button>
                  <a-dropdown>
                    <a-button type="text" aria-label="更多订单操作"><MoreOutlined /></a-button>
                    <template #overlay><a-menu><a-menu-item v-for="next in nextStatuses(record.status)" :key="next" @click="changeStatus(record,next)">设为{{ orderStatus[next]?.text }}</a-menu-item><a-menu-divider/><a-menu-item danger @click="remove(record)">删除订单</a-menu-item></a-menu></template>
                  </a-dropdown>
                </div>
              </div>
            </section>
          </div>

          <footer class="order-card__materials"><span class="material-title">DIY 备料</span><div v-if="materialsOf(record).length" class="material-tags"><span v-for="material in materialsOf(record).slice(0,5)" :key="material.id"><img v-if="material.image" :src="resolveMedia(material.image)"/><i v-else></i>{{ material.name }} <b>×{{ material.count }}</b></span><small v-if="materialsOf(record).length>5">还有 {{ materialsOf(record).length-5 }} 种</small></div><span v-else class="materials-empty">本单没有 DIY 珠材</span><button v-if="materialsOf(record).length" @click="openDetail(record)">查看完整清单 <RightOutlined /></button></footer>
        </article>
      </div>
      <a-card v-else class="surface-card" :bordered="false"><a-empty :description="aftersales ? '暂无售后申请' : '没有匹配的订单'" /></a-card>
    </a-spin>

    <div v-if="total>pageSize" class="order-pagination"><a-pagination :current="page" :page-size="pageSize" :total="total" show-size-changer :show-total="(n:number)=>`共 ${n} 笔订单`" @change="onPageChange" /></div>

    <a-drawer v-model:open="detailOpen" title="订单详情" placement="right" :width="900">
      <template #extra><a-tag v-if="selected?.status==='refund'" :color="refundMap[selected.refund_status]?.color||'gold'">{{ refundMap[selected.refund_status]?.text||'处理中' }}</a-tag><template v-else-if="selected"><StatusTag :status="selected.status" :map="orderStatus" /><a-tag v-if="selected.refund_status==='rejected'" color="red">售后已拒绝</a-tag></template></template>
      <div v-if="selected" class="detail-stack">
        <div class="detail-hero"><div><span class="muted">订单编号</span><h2 class="mono">{{ selected.order_no }}</h2><div class="muted">创建于 {{ dateTime(selected.created_at) }}</div></div><span class="hero-money">{{ money(selected.total_price) }}</span></div>

        <a-descriptions title="订单与收货" bordered :column="2" size="small">
          <a-descriptions-item label="下单用户">{{ selected.user?.nickname||selected.user?.username||`用户 ${selected.user_id}` }}</a-descriptions-item>
          <a-descriptions-item label="购买数量">{{ totalItemQuantity(selected) }} 件</a-descriptions-item>
          <a-descriptions-item label="收件人">{{ selected.consignee||'—' }}</a-descriptions-item>
          <a-descriptions-item label="联系电话"><span class="mono">{{ selected.phone||'—' }}</span></a-descriptions-item>
          <a-descriptions-item label="收货地址" :span="2">{{ selected.address||'—' }}</a-descriptions-item>
          <a-descriptions-item label="买家备注" :span="2">{{ selected.remark||'—' }}</a-descriptions-item>
        </a-descriptions>

        <a-descriptions title="金额与支付" bordered :column="3" size="small">
          <a-descriptions-item label="商品金额">{{ money(goodsAmount(selected)) }}</a-descriptions-item>
          <a-descriptions-item label="选项与运费">{{ money(selected.extra_fee) }}</a-descriptions-item>
          <a-descriptions-item label="实付金额"><b class="money">{{ money(selected.total_price) }}</b></a-descriptions-item>
          <a-descriptions-item label="支付方式">{{ payType(selected.pay_type) }}</a-descriptions-item>
          <a-descriptions-item label="优惠抵扣">{{ money(Number(selected.points_discount||0)+Number(selected.coupon_discount||0)) }}</a-descriptions-item>
          <a-descriptions-item label="支付时间">{{ dateTime(selected.pay_time||selected.paid_time) }}</a-descriptions-item>
          <a-descriptions-item label="交易流水" :span="3"><span class="mono">{{ selected.trade_no||'—' }}</span></a-descriptions-item>
        </a-descriptions>

        <section class="products-panel">
          <div class="section-heading"><div><h3>商品清单</h3><p>{{ itemsOf(selected).length }} 种商品，共 {{ totalItemQuantity(selected) }} 件</p></div><div class="chips"><span>制作：{{ optionText('production',selected.production_method) }}</span><span>包装：{{ optionText('packaging',selected.packaging_method) }}</span><span>绳线：{{ selected.rope_color||'默认' }}</span><span>配送：{{ optionText('express',selected.express_method) }}</span></div></div>
          <article v-for="item in itemsOf(selected)" :key="`${item.item_type}:${item.ref_id}`" class="detail-product">
            <div class="detail-product__preview">
              <BraceletPreview v-if="isDiyItem(item)" :pattern="itemPattern(item)" :material-map="itemMaterialMap(item)" :size="112" @select="showBead" />
              <img v-else-if="item.cover_image" :src="resolveMedia(item.cover_image)" />
              <span v-else>{{ isDiyItem(item)?'DIY':'商品' }}</span>
            </div>
            <div class="detail-product__copy"><span class="item-type">{{ itemTypeLabel(item) }}</span><h3>{{ item.title||'未命名商品' }}</h3><p v-if="isDiyItem(item)">{{ itemPattern(item).length }} 颗珠材 · {{ item.design_snapshot?.mode==='necklace'?'项链':'手链' }}</p><p v-else>商品编号 {{ item.source_code||item.ref_id }}</p><small>单价 {{ money(item.unit_price) }} × {{ item.quantity||1 }}</small></div>
            <strong>{{ money(item.line_total) }}</strong>
          </article>
        </section>

        <section v-if="selectedMaterials.length" class="material-panel">
          <div class="section-heading"><div><h3>备料清单</h3><p>{{ selectedMaterials.length }} 种珠材，共需 {{ totalRequiredBeads }} 颗</p></div><a-button @click="copyMaterialList"><CopyOutlined /> 复制清单</a-button></div>
          <a-table row-key="id" size="small" :columns="materialColumns" :data-source="selectedMaterials" :pagination="false" :scroll="{x:650}">
            <template #bodyCell="{column,record}">
              <template v-if="column.key==='material'"><div class="material-name"><img v-if="record.image" :src="resolveMedia(record.image)"/><i v-else></i><div><b>{{ record.name }}</b><span>{{ record.category||'未分类' }}<template v-if="record.subcategory"> / {{ record.subcategory }}</template></span></div></div></template>
              <template v-else-if="column.key==='size'">{{ record.size ? `${record.size} mm` : '—' }}</template>
              <template v-else-if="column.key==='required'"><b class="required-count">{{ record.count }} 颗</b></template>
              <template v-else-if="column.key==='price'">{{ money(record.price) }}</template>
            </template>
          </a-table>
        </section>

        <a-descriptions v-if="selected.express_no||selected.status==='shipped'||selected.status==='completed'" title="发货物流" bordered :column="2" size="small">
          <a-descriptions-item label="快递公司">{{ selected.express_company||'—' }}</a-descriptions-item>
          <a-descriptions-item label="快递单号"><span class="mono">{{ selected.express_no||'—' }}</span></a-descriptions-item>
          <a-descriptions-item label="发货时间">{{ dateTime(selected.ship_time) }}</a-descriptions-item>
          <a-descriptions-item v-if="selected.status==='completed'" label="完成同步时间">{{ dateTime(selected.receive_time) }}</a-descriptions-item>
          <a-descriptions-item label="微信发货同步">
            <a-tag :color="shippingSyncColor(selected.wechat_shipping_status)">{{ shippingSyncText(selected.wechat_shipping_status) }}</a-tag>
            <a-button v-if="selected.wechat_shipping_status==='failed'||selected.wechat_shipping_status==='skipped'" type="link" size="small" :loading="syncingShipping" @click="retryShippingSync">重新同步</a-button>
          </a-descriptions-item>
          <a-descriptions-item v-if="selected.wechat_shipping_error" label="同步说明" :span="2">{{ selected.wechat_shipping_error }}</a-descriptions-item>
        </a-descriptions>

        <section v-if="selected.refund_status" class="aftersale-panel">
          <div class="section-heading"><div><h3>售后处理</h3><p>{{ selected.refund_status==='rejected'?'申请已拒绝，订单已恢复原来的履约状态':'审核申请、确认退货并完成原路退款' }}</p></div><a-tag :color="refundMap[selected.refund_status]?.color||'gold'">{{ refundMap[selected.refund_status]?.text||'处理中' }}</a-tag></div>
          <a-descriptions bordered :column="1" size="small" class="aftersale-reasons">
            <a-descriptions-item label="售后类型">{{ selected.refund_type==='refund_only'?'仅退款':'退货退款' }}</a-descriptions-item>
            <a-descriptions-item label="用户申请原因">{{ selected.refund_reason||'用户未填写售后原因' }}</a-descriptions-item>
            <a-descriptions-item label="用户申请说明">{{ selected.refund_description||'未填写' }}</a-descriptions-item>
            <a-descriptions-item label="售后联系人">{{ [selected.refund_contact_name,selected.refund_contact_phone].filter(Boolean).join(' ')||'未填写' }}</a-descriptions-item>
            <a-descriptions-item label="售后联系地址">{{ selected.refund_contact_address||'未填写' }}</a-descriptions-item>
            <a-descriptions-item label="商家处理说明">{{ selected.refund_admin_remark||(selected.refund_status==='pending'?'待商家处理':'未填写') }}</a-descriptions-item>
          </a-descriptions>
          <div v-if="refundEvidence(selected).length" class="refund-evidence">
            <span>用户上传凭证</span>
            <a-image-preview-group>
              <a-image v-for="image in refundEvidence(selected)" :key="image" :src="resolveMedia(image)" :width="88" :height="88" />
            </a-image-preview-group>
          </div>
          <a-alert v-if="selected.refund_return_address" type="info" show-icon :message="`退货地址：${selected.refund_return_address}`" />
          <a-descriptions v-if="selected.refund_return_express_no" title="用户寄回物流" bordered :column="2" size="small" class="return-logistics">
            <a-descriptions-item label="快递公司">{{ selected.refund_return_express_company||'—' }}</a-descriptions-item>
            <a-descriptions-item label="快递单号"><span class="mono">{{ selected.refund_return_express_no }}</span></a-descriptions-item>
            <a-descriptions-item label="寄回时间" :span="2">{{ dateTime(selected.refund_return_shipped_at) }}</a-descriptions-item>
          </a-descriptions>
          <a-alert v-else-if="selected.refund_status==='approved' && selected.refund_type==='return_refund'" type="warning" show-icon message="等待用户填写寄回快递公司和快递单号，收到退货前不能发起退款。" />
          <div class="review-actions"><a-button v-if="selected.refund_status==='pending' && selected.refund_type==='refund_only'" type="primary" danger @click="openReview('refund')">同意退款</a-button><a-button v-if="selected.refund_status==='pending' && selected.refund_type!=='refund_only'" type="primary" @click="openReview('approve')">通过退货申请</a-button><a-button v-if="selected.refund_status==='pending'" danger @click="openReview('reject')">拒绝申请</a-button><a-button v-if="selected.refund_status==='returning'||['closed','abnormal'].includes(selected.refund_status)" type="primary" danger @click="openReview('refund')">{{ selected.refund_type==='refund_only'?'重新发起退款':'确认收到退货并退款' }}</a-button><a-button v-if="['processing','closed','abnormal'].includes(selected.refund_status) && selected.refund_out_refund_no" :loading="queryingRefund" @click="queryRefund">查询退款结果</a-button></div>
          <a-descriptions v-if="selected.refund_out_refund_no" bordered :column="2" size="small" class="refund-payment-info"><a-descriptions-item label="商户退款单号"><span class="mono">{{ selected.refund_out_refund_no }}</span></a-descriptions-item><a-descriptions-item label="微信退款单号"><span class="mono">{{ selected.refund_id||'—' }}</span></a-descriptions-item><a-descriptions-item label="退款金额">{{ money(selected.refund_amount) }}</a-descriptions-item><a-descriptions-item label="退款成功时间">{{ dateTime(selected.refund_success_at) }}</a-descriptions-item></a-descriptions>
        </section>
      </div>
      <template #footer><div class="drawer-footer"><a-button danger @click="remove(selected)">删除订单</a-button><div><a-button v-if="selected?.status==='paid'" type="primary" @click="openShip(selected)">填写物流并发货</a-button></div></div></template>
    </a-drawer>

    <a-modal v-model:open="shipOpen" title="订单发货" ok-text="确认发货" :z-index="1200" :confirm-loading="saving" @ok="ship"><a-alert type="info" show-icon :message="`订单 ${selected?.order_no || ''}。确认后会同步微信发货信息管理。`" class="modal-alert"/><a-form layout="vertical"><a-form-item label="快递公司" required><a-select v-model:value="shipForm.code" show-search :options="expressOptions" :get-popup-container="selectPopupContainer" placeholder="请选择或搜索快递公司" /></a-form-item><a-form-item label="快递单号" required><a-input v-model:value="shipForm.no" placeholder="请输入快递单号" /></a-form-item></a-form></a-modal>
    <a-modal v-model:open="reviewOpen" :title="reviewTitle" :ok-text="reviewAction==='refund'?'确认退款':'确认提交'" :z-index="1200" :ok-button-props="{danger:reviewAction==='reject'||reviewAction==='refund'}" :confirm-loading="saving" @ok="review"><a-alert v-if="reviewAction==='refund'" type="warning" show-icon :message="selected?.refund_type==='refund_only'?'提交后将立即向微信发起原路退款。':'请确认已经收到用户寄回的商品。提交后将立即向微信发起原路退款。'"/><a-form v-else layout="vertical"><a-form-item :label="reviewAction==='reject'?'拒绝原因':'商家处理说明'" :required="reviewAction==='reject'"><a-textarea v-model:value="reviewRemark" :rows="4" maxlength="300" show-count :placeholder="reviewAction==='reject'?'请填写拒绝理由':'选填，用户可在售后详情中查看'" /></a-form-item></a-form></a-modal>
    <a-modal v-model:open="beadOpen" title="珠材详情" :footer="null"><a-descriptions v-if="selectedBead" bordered :column="2" size="small"><a-descriptions-item label="名称">{{ selectedBead.name||'—' }}</a-descriptions-item><a-descriptions-item label="珠子 ID">{{ selectedBead.id||'—' }}</a-descriptions-item><a-descriptions-item label="尺寸">{{ selectedBead.size||'—' }}</a-descriptions-item><a-descriptions-item label="颜色">{{ selectedBead.color||selectedBead.color_family||'—' }}</a-descriptions-item><a-descriptions-item label="分类">{{ selectedBead.category||'—' }}</a-descriptions-item><a-descriptions-item label="材质">{{ selectedBead.type||'—' }}</a-descriptions-item></a-descriptions></a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed,onMounted,reactive,ref,watch } from 'vue'
import { message,Modal } from 'ant-design-vue'
import { ClearOutlined,CopyOutlined,MoreOutlined,ReloadOutlined,RightOutlined,SyncOutlined } from '@ant-design/icons-vue'
import PageHeader from '@/components/PageHeader.vue'
import StatusTag from '@/components/StatusTag.vue'
import BraceletPreview from '@/components/BraceletPreview.vue'
import { errorMessage,get,post } from '@/api/http'
import { dateTime,listFrom,money,orderStatus,resolveMedia,totalFrom } from '@/utils/format'
import type { DesignMaterial } from '@/utils/design'

const props=withDefaults(defineProps<{aftersales?:boolean}>(),{aftersales:false})
const materialColumns=[{title:'珠材',key:'material',width:300},{title:'尺寸',key:'size',width:90},{title:'本单需备',key:'required',width:110},{title:'下单时单价',key:'price',width:110}]
const filters=[{label:'全部订单',value:'',dot:'#779087'},{label:'待付款',value:'pending',dot:'#d89b43'},{label:'待发货',value:'paid',dot:'#bf7e26'},{label:'已发货',value:'shipped',dot:'#4b7cae'},{label:'已完成',value:'completed',dot:'#3f8b6c'},{label:'已取消',value:'cancelled',dot:'#9ca7a2'},{label:'售后/退款',value:'refund',dot:'#c55b54'}]
const refundMap:any={pending:{text:'待商家审核',color:'gold'},approved:{text:'待寄回商品',color:'blue'},returning:{text:'待商家收货',color:'cyan'},rejected:{text:'已拒绝',color:'red'},processing:{text:'退款处理中',color:'processing'},success:{text:'已退款',color:'green'},closed:{text:'退款关闭',color:'default'},abnormal:{text:'退款异常',color:'red'},cancelled:{text:'已撤回',color:'default'}}
const expressCompanies=[{code:'SF',name:'顺丰速运'},{code:'YD',name:'韵达快递'},{code:'ZTO',name:'中通快递'},{code:'YTO',name:'圆通速递'},{code:'STO',name:'申通快递'},{code:'JD',name:'京东物流'},{code:'EMS',name:'邮政 EMS'},{code:'JTSD',name:'极兔速递'}]
const expressOptions=expressCompanies.map(item=>({label:item.name,value:item.code}))
const loading=ref(false),saving=ref(false),cleaning=ref(false),queryingRefund=ref(false),syncingShipping=ref(false),syncingReceipts=ref(false),orders=ref<any[]>([]),keyword=ref(''),status=ref(props.aftersales?'refund':''),page=ref(1),pageSize=ref(20),total=ref(0),statusCounts=ref<Record<string,number>>({})
const selected=ref<any>(),detailOpen=ref(false),shipOpen=ref(false),reviewOpen=ref(false),beadOpen=ref(false),selectedBead=ref<any>()
const shipForm=reactive({code:'',no:''}),reviewAction=ref<'approve'|'reject'|'refund'>('approve'),reviewRemark=ref('')
const selectedMaterials=computed(()=>materialsOf(selected.value))
const totalRequiredBeads=computed(()=>selectedMaterials.value.reduce((sum,material)=>sum+Number(material.count||0),0))
const reviewTitle=computed(()=>reviewAction.value==='approve'?'通过退货申请':reviewAction.value==='reject'?'拒绝售后申请':selected.value?.refund_type==='refund_only'?'同意仅退款':'确认收到退货并退款')

async function load(){loading.value=true;try{const data:any=await get('/api/order/list',{page:page.value,pageSize:pageSize.value,status:status.value,keyword:keyword.value.trim(),admin:true});orders.value=listFrom(data);total.value=totalFrom(data,orders.value.length);statusCounts.value=data?.status_counts||{}}catch(e){message.error(errorMessage(e))}finally{loading.value=false}}
function search(){page.value=1;void load()} function setStatus(value:string){status.value=value;page.value=1;void load()} function onPageChange(nextPage:number,nextSize:number){page.value=nextSize!==pageSize.value?1:nextPage;pageSize.value=nextSize;void load()}
function filterCount(value:string){return statusCounts.value[value||'all']||0}
function itemsOf(record:any):any[]{return Array.isArray(record?.items)?record.items:[]}
function refundEvidence(record:any):string[]{return Array.isArray(record?.refund_evidence)?record.refund_evidence.map((item:unknown)=>String(item||'')).filter(Boolean):[]}
function isDiyItem(item:any){return item?.item_type==='diy_design'}
function itemTypeLabel(item:any){return isDiyItem(item)?'DIY 定制':'商城商品'}
function itemSnapshot(item:any){const snapshot=item?.design_snapshot;return snapshot&&typeof snapshot==='object'&&!Array.isArray(snapshot)?snapshot:{}}
function itemPattern(item:any):unknown[]{const value=itemSnapshot(item).pattern;return Array.isArray(value)?value:[]}
function itemMaterialMap(item:any):Record<string,Record<string,unknown>>{const value=itemSnapshot(item).material_map;return value&&typeof value==='object'&&!Array.isArray(value)?value:{}}
function totalItemQuantity(record:any){return itemsOf(record).reduce((sum,item)=>sum+Math.max(1,Number(item.quantity)||1),0)}
function goodsAmount(record:any){return itemsOf(record).reduce((sum,item)=>sum+Math.max(0,Number(item.line_total)||0),0)}
function materialsOf(record:any):DesignMaterial[]{
  const materialMap=new Map<string,DesignMaterial>()
  for(const item of itemsOf(record)){
    if(!isDiyItem(item))continue
    const quantity=Math.max(1,Number(item.quantity)||1)
    const summary=itemSnapshot(item).material_summary
    if(!Array.isArray(summary))continue
    for(const source of summary){
      const id=String(source?.id||'').replace(/^dynamic_/,'')
      if(!id)continue
      const count=Math.max(0,Number(source.count)||0)*quantity
      const existing=materialMap.get(id)
      if(existing){existing.count+=count;existing.subtotal=Math.round((existing.subtotal+Math.max(0,Number(source.price)||0)*count)*100)/100;continue}
      materialMap.set(id,{...source,id,name:String(source.name||'未命名珠材'),image:String(source.image||source.imageUrl||''),size:Number(source.size||source.mm||0),price:Math.max(0,Number(source.price)||0),count,subtotal:Math.round(Math.max(0,Number(source.price)||0)*count*100)/100,missing:Boolean(source.missing)})
    }
  }
  return [...materialMap.values()]
}
function optionText(group:'production'|'packaging'|'express',value:unknown){const code=String(value||'');const maps:Record<string,Record<string,string>>={production:{diy:'自主设计',assembled:'成品制作'},packaging:{normal:'普通包装',gift:'礼盒包装'},express:{yunda:'韵达快递',sf:'顺丰快递'}};return maps[group][code]||code||'未选择'}
function openDetail(row:any){selected.value=row;detailOpen.value=true}
function expressName(code:string){return expressCompanies.find(item=>item.code===code)?.name||''}
function expressCode(name:string){return expressCompanies.find(item=>item.name===name)?.code||''}
function selectPopupContainer(trigger:HTMLElement){return trigger.parentElement||document.body}
function openShip(row:any){selected.value=row;shipForm.code=row.express_code||expressCode(row.express_company||'');shipForm.no=row.express_no||'';shipOpen.value=true}
function shippingSyncText(value:string){return ({success:'已同步微信',failed:'同步失败',pending:'同步中',skipped:'未同步'} as Record<string,string>)[value]||'未同步'}
function shippingSyncColor(value:string){return ({success:'green',failed:'red',pending:'processing',skipped:'default'} as Record<string,string>)[value]||'default'}
function nextStatuses(current:string){const flow:any={pending:['cancelled'],shipped:['completed']};return flow[current]||[]}
function payType(value:string){return ({wechat:'微信支付',wxpay:'微信支付'} as any)[value]||value||'未支付'}
function showBead(bead:any){selectedBead.value=bead;beadOpen.value=true}
async function copyMaterialList(){if(!selected.value)return;const lines=[`订单：${selected.value.order_no}`,'商品：',...itemsOf(selected.value).map(item=>`- [${itemTypeLabel(item)}] ${item.title||'未命名商品'} × ${item.quantity||1}`),'DIY 备料：',...selectedMaterials.value.map(material=>`- ${material.name}${material.size?`（${material.size}mm）`:''} × ${material.count} 颗`)];try{await navigator.clipboard.writeText(lines.join('\n'));message.success('备料清单已复制')}catch{message.error('复制失败，请手动选择清单内容')}}
async function changeStatus(row:any,next:string){Modal.confirm({title:`将订单状态改为“${orderStatus[next]?.text}”？`,content:next==='cancelled'?'系统会先查询微信支付状态；未付款才会关单并取消。':'状态变更会同步影响用户端订单流程。',okText:'确认变更',cancelText:'取消',async onOk(){try{if(next==='cancelled')await post('/api/order/cancel',{order_id:row.id});else await post('/api/order/update_status',{id:row.id,status:next});message.success('订单状态已更新');await load()}catch(e){message.error(errorMessage(e))}}})}
async function ship(){if(!shipForm.code||!shipForm.no.trim())return message.warning('请完整填写快递公司和快递单号');saving.value=true;try{const result:any=await post('/api/order/ship',{order_id:selected.value.id,express_company:expressName(shipForm.code),express_code:shipForm.code,express_no:shipForm.no.trim()});if(result?.wechat_shipping_status==='success')message.success('订单已发货，并已同步微信');else message.warning(`订单已发货；${result?.wechat_shipping_error||'微信发货信息暂未同步'}`);shipOpen.value=false;detailOpen.value=false;await load()}catch(e){message.error(errorMessage(e))}finally{saving.value=false}}
async function retryShippingSync(){if(!selected.value?.id)return;syncingShipping.value=true;try{const result:any=await post('/api/order/ship_sync',{order_id:selected.value.id});selected.value.wechat_shipping_status=result?.wechat_shipping_status||'success';selected.value.wechat_shipping_synced_at=result?.wechat_shipping_synced_at||'';selected.value.wechat_shipping_error='';message.success('微信发货信息同步成功');await load()}catch(e){message.error(errorMessage(e))}finally{syncingShipping.value=false}}
function syncReceiptStatuses(){Modal.confirm({title:'同步微信收货状态？',content:'系统会查询全部本地“已发货”订单。只有微信已确认收货、交易完成或进入结算的订单，才会更新为“已完成”。',okText:'开始同步',cancelText:'取消',async onOk(){syncingReceipts.value=true;try{const result:any=await post('/api/order/receive_sync');const summary=`共检查 ${result?.checked_count||0} 笔：更新完成 ${result?.completed_count||0} 笔、仍待收货 ${result?.waiting_count||0} 笔、跳过 ${result?.skipped_count||0} 笔、失败 ${result?.failed_count||0} 笔`;if(result?.failed_count)message.warning(summary,6);else message.success(summary,6);await load()}catch(e){message.error(errorMessage(e))}finally{syncingReceipts.value=false}}})}
function remove(row:any){Modal.confirm({title:`删除订单 ${row.order_no}？`,content:row.status==='pending'?'系统会先确认未付款并关闭微信订单，再从订单列表删除；支付流水仍保留。':'订单将从管理列表移除，支付流水仍会保留。',okText:'确认删除',okType:'danger',cancelText:'取消',async onOk(){try{if(row.status==='pending')await post('/api/order/cancel',{order_id:row.id});await post('/api/order/delete',{id:row.id});message.success('订单已删除');detailOpen.value=false;await load()}catch(e){message.error(errorMessage(e))}}})}
function cleanup(){Modal.confirm({title:'关闭超时未支付订单？',content:'系统将向微信查询付款结果，仅关闭超过 30 分钟且确认未付款的订单，不删除订单与设计快照。',okText:'确认处理',okType:'danger',cancelText:'取消',async onOk(){cleaning.value=true;try{const result:any=await post('/api/order/cleanup',{minutes:30});message.success(`已关闭 ${result?.closed_count||0} 笔，补记已支付 ${result?.paid_count||0} 笔，失败 ${result?.failed_count||0} 笔`);await load()}catch(e){message.error(errorMessage(e))}finally{cleaning.value=false}}})}
function openReview(action:'approve'|'reject'|'refund'){reviewAction.value=action;reviewRemark.value='';reviewOpen.value=true}
async function review(){if(reviewAction.value==='reject'&&!reviewRemark.value.trim())return message.warning('请填写拒绝原因');saving.value=true;try{await post('/api/order/refund_review',{order_id:selected.value.id,action:reviewAction.value,remark:reviewAction.value==='refund'?'':reviewRemark.value.trim()});message.success(reviewAction.value==='refund'?'退款请求已提交':'售后状态已更新');reviewOpen.value=false;detailOpen.value=false;await load()}catch(e){message.error(errorMessage(e))}finally{saving.value=false}}
async function queryRefund(){if(!selected.value?.id)return;queryingRefund.value=true;try{const result:any=await post('/api/pay/refund/query',{order_id:selected.value.id});Object.assign(selected.value,result);message.success('退款状态已更新');await load()}catch(e){message.error(errorMessage(e))}finally{queryingRefund.value=false}}
watch(()=>props.aftersales,(value)=>{status.value=value?'refund':'';page.value=1;void load()})
onMounted(load)
</script>

<style scoped>
.order-list{display:flex;flex-direction:column;gap:12px}.order-card{overflow:hidden;border:1px solid #e2e9e6;border-left:4px solid #aab8b3;border-radius:16px;background:#fff;box-shadow:0 5px 18px rgba(37,66,57,.035);transition:border-color .2s,box-shadow .2s}.order-card:hover{border-color:#bfd2ca;box-shadow:0 10px 26px rgba(37,66,57,.075)}.order-card.is-paid{border-left-color:#c58a35}.order-card.is-shipped{border-left-color:#4b7cae}.order-card.is-completed{border-left-color:#3f8b6c}.order-card.is-refund{border-left-color:#c55b54}.order-card__header{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:11px 16px;border-bottom:1px solid #edf1ef;background:#fafcfb}.order-identity{display:flex;align-items:center;gap:12px;min-width:0}.order-identity>a{font-size:12px}.order-identity>span{color:#98a49f;font-size:10px}.order-state{display:flex;align-items:center;gap:8px}.order-state>span{color:#a16860;font-size:10px}.order-card__body{display:grid;grid-template-columns:minmax(250px,1.18fr) minmax(205px,1fr) minmax(135px,.7fr) 150px;align-items:center;gap:24px;padding:15px 18px}.block-label{display:block;margin-bottom:6px;color:#9aa7a2;font-size:9px;letter-spacing:.08em}.card-design{display:flex;align-items:center;gap:15px;min-width:0}.card-design>div:last-child{min-width:0}.card-design h3,.card-info h4{overflow:hidden;margin:0;color:#334b43;font-size:13px;text-overflow:ellipsis;white-space:nowrap}.card-design p,.card-info p{overflow:hidden;margin:5px 0 0;color:#80908a;font-size:10px;text-overflow:ellipsis;white-space:nowrap}.card-design p b{color:#9d6c2e}.card-info{min-width:0;padding-left:18px;border-left:1px solid #edf1ef}.card-info h4 small{margin-left:6px;color:#657970;font-size:10px;font-weight:400}.card-info>small{display:block;overflow:hidden;margin-top:5px;color:#a1aba7;font-size:9px;text-overflow:ellipsis;white-space:nowrap}.card-fulfillment{padding-left:18px;border-left:1px solid #edf1ef}.card-fulfillment p{margin:4px 0;color:#52675f;font-size:10px}.card-fulfillment p i{display:inline-block;width:34px;color:#a0aba7;font-style:normal}.card-settlement{align-self:stretch;display:flex;flex-direction:column;justify-content:center;padding-left:18px;border-left:1px solid #edf1ef}.card-settlement>strong{color:#a57432;font:700 22px Georgia,serif}.card-actions{display:flex;flex-direction:column;gap:6px;margin-top:9px}.card-actions__secondary{display:grid;grid-template-columns:minmax(0,1fr) 32px;align-items:center;gap:3px}.card-actions :deep(.ant-btn-primary){background:#286d5a}.order-card__materials{display:flex;align-items:center;gap:10px;min-height:42px;padding:7px 16px;border-top:1px dashed #e5ebe8;background:#fcfdfc}.material-title{flex:0 0 auto;color:#73847d;font-size:10px;font-weight:700}.material-tags{display:flex;min-width:0;flex:1;align-items:center;gap:6px;overflow:hidden}.material-tags>span{display:flex;align-items:center;gap:4px;min-width:0;padding:4px 7px;border-radius:8px;color:#5e716a;background:#eef4f1;font-size:9px;white-space:nowrap}.material-tags img,.material-tags i{width:18px;height:18px;border-radius:50%;object-fit:cover}.material-tags i{background:linear-gradient(135deg,#dfe8e4,#bccdc6)}.material-tags b{color:#9e6c2e}.material-tags small{flex:0 0 auto;color:#95a19c;font-size:9px}.order-card__materials>button{display:flex;align-items:center;gap:4px;flex:0 0 auto;padding:4px 0;border:0;color:#2d745f;background:transparent;cursor:pointer;font-size:10px}.order-pagination{display:flex;justify-content:flex-end;padding:18px 4px 4px}
.status-filter{display:flex;gap:8px;overflow:auto;padding:4px}.status-filter button{display:flex;align-items:center;gap:8px;flex:0 0 auto;padding:9px 14px;border:1px solid #e0e8e4;border-radius:99px;color:#6c7d77;background:#fff;cursor:pointer}.status-filter button>span{width:7px;height:7px;border-radius:50%}.status-filter button em{min-width:20px;padding:1px 6px;border-radius:99px;color:#7d8d87;background:#f0f4f2;font-size:10px;font-style:normal;text-align:center}.status-filter button.active{border-color:#2c705d;color:#245b4c;background:#eaf3ef;box-shadow:0 4px 12px rgba(31,104,84,.08)}.status-filter button.active em{color:#fff;background:#357864}.order-link{font-weight:700}.order-meta{display:flex;flex-direction:column;gap:2px;margin-top:5px;color:#9aa7a2;font-size:10px}.material-cell{display:flex;min-width:0;flex-direction:column}.design-name{overflow:hidden;color:#2f5146;font-weight:700;text-overflow:ellipsis;white-space:nowrap}.material-mini-list{display:flex;align-items:center;gap:5px;overflow:hidden;margin-top:7px}.material-mini-list>span{display:flex;align-items:center;gap:4px;min-width:0;padding:3px 6px;border-radius:7px;color:#65766f;background:#f2f5f3;font-size:9px;white-space:nowrap}.material-mini-list img,.material-mini-list i{width:16px;height:16px;border-radius:50%;object-fit:cover}.material-mini-list i{background:linear-gradient(135deg,#dfe8e4,#bccdc6)}.material-mini-list small{color:#8b9893;white-space:nowrap}.material-options{overflow:hidden;margin-top:5px;color:#9aa6a1;font-size:9px;text-overflow:ellipsis;white-space:nowrap}.refund-sub{margin-top:4px;color:#9d615d;font-size:10px}.detail-stack{display:flex;flex-direction:column;gap:24px}.detail-hero{display:flex;align-items:flex-start;justify-content:space-between;padding:20px;border-radius:16px;color:#eaf4ef;background:linear-gradient(135deg,#173f35,#286d5a)}.detail-hero .muted{color:rgba(255,255,255,.58)}.detail-hero h2{margin:6px 0;color:white;font-size:18px}.hero-money{font:700 28px Georgia,serif;color:#ecd9a9}.design-panel{display:flex;align-items:center;gap:28px;padding:18px;border:1px solid #e5ece9;border-radius:16px;background:#fafcfa}.design-copy{flex:1}.design-copy .eyebrow{color:#a28656;font-size:10px;letter-spacing:.16em}.design-copy h3{margin:8px 0 4px;color:#26493e;font:700 22px Georgia,'Noto Serif SC',serif}.design-copy p{color:#84918c}.chips{display:flex;flex-wrap:wrap;gap:7px}.chips span{padding:6px 9px;border-radius:7px;color:#62746e;background:#edf3f0;font-size:11px}.snapshot-note{display:block;margin-top:12px;color:#99a49f}.material-panel{padding:18px;border:1px solid #e5ece9;border-radius:16px;background:#fff}.material-panel .section-heading{align-items:center;margin-bottom:14px}.material-panel .section-heading p{margin:4px 0 0;color:#8a9792;font-size:11px}.material-name{display:flex;align-items:center;gap:10px}.material-name img,.material-name>i{width:38px;height:38px;border-radius:10px;object-fit:cover}.material-name>i{background:linear-gradient(135deg,#e9efec,#cbd9d3)}.material-name>div{display:flex;min-width:0;flex-direction:column}.material-name b{overflow:hidden;color:#354d45;text-overflow:ellipsis;white-space:nowrap}.material-name span{margin-top:3px;color:#99a49f;font-size:10px}.required-count{color:#a06d2d}.aftersale-panel{padding:18px;border:1px solid #f0ddda;border-radius:16px;background:#fffaf9}.section-heading{display:flex;justify-content:space-between;gap:15px}.section-heading h3{margin:0}.section-heading p{color:#7f716f}.aftersale-reasons{margin:14px 0}.review-actions{display:flex;gap:8px;margin:16px 0}.drawer-footer{display:flex;justify-content:space-between}.modal-alert{margin-bottom:18px}
.refund-evidence{display:flex;align-items:flex-start;gap:16px;margin:14px 0;padding:12px;border-radius:10px;background:#f7f8f5}.refund-evidence>span{flex:0 0 auto;padding-top:6px;color:#7f8c87;font-size:11px}.refund-evidence :deep(.ant-image){overflow:hidden;margin-right:8px;border-radius:9px}.refund-evidence :deep(img){object-fit:cover}
.return-logistics{margin-top:14px}
.card-products{min-width:0}.card-product-mini{display:flex;align-items:center;min-width:0;gap:10px}.card-product-mini+.card-product-mini{margin-top:7px}.card-product-mini__preview{display:grid;width:54px;height:54px;flex:0 0 54px;place-items:center;overflow:hidden;border:1px solid #e7ece9;border-radius:11px;color:#7b8d86;background:#f3f6f4;font-size:10px}.card-product-mini__preview img{width:100%;height:100%;object-fit:cover}.card-product-mini>div:last-child{min-width:0}.card-product-mini h3{overflow:hidden;margin:0;color:#334b43;font-size:12px;text-overflow:ellipsis;white-space:nowrap}.card-product-mini p{margin:4px 0 0;color:#84928d;font-size:9px}.card-products>small{display:block;margin-top:6px;color:#9aa6a1;font-size:9px}.materials-empty{color:#99a59f;font-size:10px}.products-panel{padding:18px;border:1px solid #e5ece9;border-radius:16px;background:#fff}.products-panel>.section-heading{align-items:flex-start;margin-bottom:14px}.products-panel>.section-heading p{margin:4px 0 0;color:#8a9792;font-size:11px}.products-panel>.section-heading .chips{justify-content:flex-end;max-width:58%}.detail-product{display:grid;grid-template-columns:112px minmax(0,1fr) auto;align-items:center;gap:18px;padding:16px 0;border-top:1px solid #edf1ef}.detail-product__preview{display:grid;width:112px;height:112px;place-items:center;overflow:hidden;border:1px solid #e5ece9;border-radius:15px;color:#82918b;background:#f2f5f3}.detail-product__preview img{width:100%;height:100%;object-fit:cover}.detail-product__copy{min-width:0}.detail-product__copy .item-type{color:#2d745f;font-size:10px;font-weight:700;letter-spacing:.08em}.detail-product__copy h3{margin:6px 0 4px;color:#29483e;font-size:16px}.detail-product__copy p{margin:0;color:#87938f;font-size:11px}.detail-product__copy small{display:block;margin-top:8px;color:#9aa5a0}.detail-product>strong{color:#a06d2d;font:700 18px Georgia,serif;white-space:nowrap}
@media(max-width:650px){.products-panel>.section-heading{flex-direction:column}.products-panel>.section-heading .chips{justify-content:flex-start;max-width:none}.detail-product{grid-template-columns:82px minmax(0,1fr)}.detail-product__preview{width:82px;height:82px}.detail-product>strong{grid-column:2;text-align:right}.detail-hero{flex-direction:column;gap:18px}}
@media(max-width:1100px){.order-card__body{grid-template-columns:minmax(250px,1.2fr) minmax(210px,1fr) 145px}.card-fulfillment{display:none}}
@media(max-width:760px){.order-card__header,.order-identity{align-items:flex-start}.order-identity{flex-direction:column;gap:2px}.order-card__body{grid-template-columns:1fr}.card-info,.card-settlement{padding:12px 0 0;border-top:1px solid #edf1ef;border-left:0}.order-card__materials{align-items:flex-start;flex-wrap:wrap}.material-tags{order:3;flex-basis:100%}}
</style>
