<template>
  <div class="page-shell">
    <PageHeader title="系统设置" description="统一配置商城运营、内容展示、登录与支付能力">
      <a-button :loading="loading" @click="load"><ReloadOutlined /> 放弃修改</a-button>
      <a-button type="primary" :loading="saving" @click="save"><SaveOutlined /> 保存全部设置</a-button>
    </PageHeader>
    <a-alert type="warning" show-icon message="支付和登录密钥属于敏感信息" description="新版界面已使用密码型输入隐藏内容；请只向必要的管理员开放本页面。" />
    <a-skeleton v-if="loading" active :paragraph="{rows:14}" />
    <a-card v-else class="settings-card surface-card" :bordered="false">
      <a-tabs v-model:active-key="tab" tab-position="left" class="settings-tabs">
        <a-tab-pane key="business"><template #tab><span><FundOutlined/> 经营设置</span></template>
          <div class="settings-content"><div class="section-intro"><h2>经营与规则</h2><p>设置分佣、分类、积分和售后基础规则。</p></div>
            <section class="setting-section"><h3 class="setting-section-title">推广分佣</h3><div class="form-grid"><a-form-item label="一级推广分佣比例"><a-input-number v-model:value="form.commission_rate_percent" :min="0" :max="100" :precision="2" addon-after="%" style="width:100%"/><div class="field-help">直接下级消费后，上级获得的实付金额比例</div></a-form-item><a-form-item label="二级推广分佣比例"><a-input-number v-model:value="form.commission_rate_level2_percent" :min="0" :max="100" :precision="2" addon-after="%" style="width:100%"/><div class="field-help">下下级消费后，二级推广人获得的比例</div></a-form-item></div></section>
            <section class="setting-section"><h3 class="setting-section-title">商城规则</h3><a-form-item label="盘珠分类展示顺序"><a-input v-model:value="form.bead_category_order" placeholder="水晶,沉香,菩提,文玩,配饰"/><div class="field-help">使用英文逗号分隔，只改变显示顺序</div></a-form-item><a-form-item label="积分规则说明"><a-textarea v-model:value="form.points_rule_text" :rows="4"/></a-form-item><a-form-item label="售后退货地址"><a-textarea v-model:value="form.refund_return_address" :rows="4" placeholder="收件人、电话、详细地址和注意事项"/></a-form-item></section>
          </div>
        </a-tab-pane>
        <a-tab-pane key="store"><template #tab><span><MobileOutlined/> 商城展示</span></template>
          <div class="settings-content"><div class="section-intro"><h2>小程序与站点展示</h2><p>管理品牌名称、首页图片、购买须知和客服信息。</p></div>
            <section class="setting-section"><div class="switch-heading"><div><h3 class="setting-section-title">小程序微信登录</h3><p>启用后，小程序使用此处配置的 AppID 和 AppSecret</p></div><a-switch v-model:checked="form.miniprogram_enabled"/></div><div class="form-grid"><a-form-item label="小程序名称"><a-input v-model:value="form.miniprogram_name"/></a-form-item><a-form-item label="小程序 AppID"><a-input v-model:value="form.miniprogram_app_id"/></a-form-item><a-form-item label="小程序 AppSecret"><a-input-password v-model:value="form.miniprogram_app_secret"/></a-form-item></div></section>
            <section class="setting-section"><h3 class="setting-section-title">品牌图片</h3><a-form-item label="首页底部图片"><ImageUploader v-model="form.miniprogram_home_bottom_image"/></a-form-item><a-form-item label="盘子中间 Logo"><ImageUploader v-model="form.miniprogram_tray_logo_image"/></a-form-item><a-form-item label="站点标题 Logo"><ImageUploader v-model="form.site_title_logo_image"/></a-form-item><a-form-item label="网站 Favicon"><ImageUploader v-model="form.favicon_url"/></a-form-item></section>
            <section class="setting-section"><h3 class="setting-section-title">用户可见文案</h3><a-form-item label="购买须知"><a-textarea v-model:value="form.miniprogram_purchase_notice" :rows="5"/></a-form-item><div class="form-grid"><a-form-item label="客服微信号"><a-input v-model:value="contact.wechatId"/></a-form-item><a-form-item label="客服微信二维码"><ImageUploader v-model="contact.wechatQr"/></a-form-item></div></section>
            <section class="setting-section"><h3 class="setting-section-title">首页轮播图</h3><div class="slide-upload"><a-upload :show-upload-list="false" accept="image/*" :custom-request="uploadSlide"><a-button :loading="uploadingSlide"><UploadOutlined/> 上传并追加轮播图</a-button></a-upload><span>支持图片、标签、标题、说明和跳转路径</span></div><JsonEditorCard ref="slideEditor" v-model="form.miniprogram_home_slides_json" title="轮播配置 JSON" description="顶层必须为数组；留空时前端使用默认轮播。" :rows="12"/><div v-if="slides.length" class="slide-preview"><div v-for="(slide,index) in slides" :key="index"><img :src="resolveMedia(slide.image||slide.url)"/><section><b>{{ slide.title||slide.tag||`轮播 ${index+1}` }}</b><p>{{ slide.desc }}</p></section><button @click="removeSlide(index)"><DeleteOutlined/></button></div></div></section>
          </div>
        </a-tab-pane>
        <a-tab-pane key="content"><template #tab><span><ReadOutlined/> 内容资料</span></template>
          <div class="settings-content"><div class="section-intro"><h2>内容中心</h2><p>维护商城教程、品牌资料、使用指南与尺寸说明，支持中英文内容。</p></div>
            <JsonEditorCard v-for="item in jsonEditors" :key="item.key" :ref="(el:any)=>setJsonRef(item.key,el)" v-model="form[item.key]" :title="item.title" :description="item.description"/>
          </div>
        </a-tab-pane>
        <a-tab-pane key="integrations"><template #tab><span><ApiOutlined/> 登录与支付</span></template>
          <div class="settings-content"><div class="section-intro"><h2>第三方集成</h2><p>配置小程序支付、Google 登录和 Creem 支付。</p></div>
            <section class="setting-section"><div class="switch-heading"><div><h3 class="setting-section-title">微信支付（小程序）</h3><p>需要商户平台 JSAPI 权限、证书与可公网访问的回调</p></div><a-switch v-model:checked="form.wxpay_enabled"/></div><div class="form-grid"><a-form-item label="支付 AppID"><a-input v-model:value="form.wxpay_app_id"/></a-form-item><a-form-item label="商户号 MchID"><a-input v-model:value="form.wxpay_mch_id"/></a-form-item><a-form-item label="API v3 Key"><a-input-password v-model:value="form.wxpay_api_v3_key"/></a-form-item><a-form-item label="商户证书序列号"><a-input v-model:value="form.wxpay_mch_serial_no"/></a-form-item><a-form-item class="span-2" label="支付回调地址"><a-input v-model:value="form.wxpay_notify_url"/></a-form-item><a-form-item class="span-2" label="商户 API 私钥"><a-textarea v-model:value="form.wxpay_private_key" :rows="6" class="secret-area"/></a-form-item></div></section>
            <section class="setting-section"><div class="switch-heading"><div><h3 class="setting-section-title">Google 登录</h3><p>网页端第三方登录配置</p></div><a-switch v-model:checked="form.google_enabled"/></div><div class="form-grid"><a-form-item label="Google Client ID"><a-input v-model:value="form.google_client_id"/></a-form-item><a-form-item label="Google Client Secret"><a-input-password v-model:value="form.google_client_secret"/></a-form-item><a-form-item class="span-2" label="Redirect URI"><a-input v-model:value="form.google_redirect_uri"/></a-form-item></div></section>
            <section class="setting-section"><div class="switch-heading"><div><h3 class="setting-section-title">Creem 支付</h3><p>Webhook 路径：/api/pay/notify_creem</p></div><a-switch v-model:checked="form.creem_enabled"/></div><div class="form-grid"><a-form-item label="API Key"><a-input-password v-model:value="form.creem_api_key"/></a-form-item><a-form-item label="Product ID"><a-input v-model:value="form.creem_product_id"/></a-form-item><a-form-item class="span-2" label="API URL"><a-input v-model:value="form.creem_api_url"/></a-form-item><a-form-item label="支付成功返回地址"><a-input v-model:value="form.creem_success_url"/></a-form-item><a-form-item label="取消支付返回地址"><a-input v-model:value="form.creem_cancel_url"/></a-form-item><a-form-item class="span-2" label="Webhook Secret"><a-input-password v-model:value="form.creem_webhook_secret"/></a-form-item></div></section>
          </div>
        </a-tab-pane>
      </a-tabs>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { computed,onMounted,reactive,ref } from 'vue'
import { message } from 'ant-design-vue'
import { ApiOutlined,DeleteOutlined,FundOutlined,MobileOutlined,ReadOutlined,ReloadOutlined,SaveOutlined,UploadOutlined } from '@ant-design/icons-vue'
import PageHeader from '@/components/PageHeader.vue'
import ImageUploader from '@/components/ImageUploader.vue'
import JsonEditorCard from '@/components/JsonEditorCard.vue'
import { errorMessage,get,post,uploadImage } from '@/api/http'
import { resolveMedia } from '@/utils/format'

const tab=ref('business'),loading=ref(false),saving=ref(false),uploadingSlide=ref(false),slideEditor=ref<any>(),jsonRefs:Record<string,any>={}
const form=reactive<any>({commission_rate_percent:0,commission_rate_level2_percent:0})
const contact=reactive({wechatId:'',wechatQr:''})
const jsonEditors=[
  {key:'home_bead_tutorial_steps_json',title:'首页盘珠教程',description:'教程步骤数组，可配置图片和中英文说明。'},
  {key:'about_us_json',title:'关于我们',description:'品牌名称、标语及中英文品牌介绍。'},
  {key:'brand_philosophy_json',title:'品牌理念',description:'图标、名称与中英文说明条目。'},
  {key:'guide_4steps_json',title:'四步使用指南',description:'图标、标题与中英文操作说明。'},
  {key:'guide_notice_items_json',title:'购买须知条目',description:'购买前需要展示的中英文须知。'},
  {key:'wrist_measurement_json',title:'手腕测量步骤',description:'测量步骤、图标、标题与中英文说明。'},
  {key:'bead_size_json',title:'珠子尺寸说明',description:'尺寸、标签和中英文详细说明。'},
]
const stringKeys=['bead_category_order','points_rule_text','refund_return_address','miniprogram_app_id','miniprogram_app_secret','miniprogram_name','miniprogram_home_bottom_image','miniprogram_tray_logo_image','site_title_logo_image','miniprogram_purchase_notice','miniprogram_home_slides_json','favicon_url','wxpay_app_id','wxpay_mch_id','wxpay_api_v3_key','wxpay_mch_serial_no','wxpay_private_key','wxpay_notify_url','google_client_id','google_client_secret','google_redirect_uri','creem_api_key','creem_product_id','creem_api_url','creem_success_url','creem_cancel_url','creem_webhook_secret',...jsonEditors.map(x=>x.key)]
const boolKeys=['miniprogram_enabled','wxpay_enabled','google_enabled','creem_enabled']
const slides=computed<any[]>(()=>{try{const value=JSON.parse(form.miniprogram_home_slides_json||'[]');return Array.isArray(value)?value:[]}catch{return[]}})
function setJsonRef(key:string,el:any){if(el)jsonRefs[key]=el}
async function load(){loading.value=true;try{const data:any=await get('/api/admin/settings_get');Object.assign(form,data,{commission_rate_percent:Number(data.commission_rate||0)*100,commission_rate_level2_percent:Number(data.commission_rate_level2||0)*100});for(const key of stringKeys)form[key]=String(data[key]??'');for(const key of boolKeys)form[key]=Boolean(data[key]);try{Object.assign(contact,JSON.parse(data.contact_service_json||'{}'))}catch{Object.assign(contact,{wechatId:'',wechatQr:''})}}catch(e){message.error(errorMessage(e))}finally{loading.value=false}}
async function uploadSlide(options:any){uploadingSlide.value=true;try{const result=await uploadImage(options.file as File);const next=[...slides.value,{image:result.url,tag:'新品',title:'定义你的专属串珠',desc:'从材质、色彩与佩戴场景出发。',targetPath:'/pages/index/index?tab=diy'}];form.miniprogram_home_slides_json=JSON.stringify(next,null,2);options.onSuccess?.(result);message.success('轮播图已追加，保存后生效')}catch(e){message.error(errorMessage(e));options.onError?.(e as Error)}finally{uploadingSlide.value=false}}
function removeSlide(index:number){const next=slides.value.filter((_,i)=>i!==index);form.miniprogram_home_slides_json=next.length?JSON.stringify(next,null,2):''}
async function save(){if(!slideEditor.value?.validate())return message.error('首页轮播 JSON 格式不正确');for(const item of jsonEditors)if(!jsonRefs[item.key]?.validate())return message.error(`“${item.title}”JSON 格式不正确`);if(form.commission_rate_percent<0||form.commission_rate_percent>100||form.commission_rate_level2_percent<0||form.commission_rate_level2_percent>100)return message.warning('分佣比例必须在 0% 到 100% 之间');const payload:any={commission_rate:Number(form.commission_rate_percent)/100,commission_rate_level2:Number(form.commission_rate_level2_percent)/100,contact_service_json:JSON.stringify(contact)};for(const key of stringKeys)payload[key]=String(form[key]??'').trim();for(const key of boolKeys)payload[key]=Boolean(form[key]);saving.value=true;try{await post('/api/admin/settings_update',payload);message.success('系统设置已保存并生效');await load()}catch(e){message.error(errorMessage(e))}finally{saving.value=false}}
onMounted(load)
</script>

<style scoped>
.settings-card :deep(.ant-card-body){padding:0}.settings-tabs{min-height:700px}.settings-tabs :deep(.ant-tabs-nav){width:190px;margin:0;padding:20px 12px;border-right:1px solid #edf1ef}.settings-tabs :deep(.ant-tabs-tab){padding:12px 14px!important;border-radius:9px}.settings-tabs :deep(.ant-tabs-tab-active){background:#edf5f1}.settings-tabs :deep(.ant-tabs-content-holder){padding:28px}.settings-content{display:flex;flex-direction:column;gap:18px;max-width:900px}.section-intro{margin-bottom:2px}.section-intro h2{margin:0;color:#23473c;font:700 24px Georgia,'Noto Serif SC',serif}.section-intro p,.switch-heading p{margin:5px 0 0;color:#8b9893;font-size:12px}.switch-heading{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:18px}.switch-heading .setting-section-title{margin-bottom:0}.field-help{margin-top:5px;color:#96a29d;font-size:10px}.secret-area{font-family:'SFMono-Regular',Consolas,monospace}.slide-upload{display:flex;align-items:center;gap:12px;margin-bottom:14px}.slide-upload>span{color:#929f99;font-size:11px}.slide-preview{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:14px}.slide-preview>div{position:relative;overflow:hidden;border:1px solid #e4eae7;border-radius:12px;background:#fff}.slide-preview img{width:100%;height:110px;object-fit:cover;background:#f1f4f2}.slide-preview section{padding:10px}.slide-preview section p{display:-webkit-box;overflow:hidden;margin:4px 0;color:#89958f;font-size:10px;-webkit-box-orient:vertical;-webkit-line-clamp:2}.slide-preview button{position:absolute;right:6px;top:6px;width:28px;height:28px;border:0;border-radius:8px;color:white;background:rgba(132,54,49,.82);cursor:pointer}
@media(max-width:850px){.settings-tabs :deep(.ant-tabs-nav){width:100%;margin:0;padding:8px;border-right:0}.settings-tabs :deep(.ant-tabs-nav-list){overflow:auto}.settings-tabs :deep(.ant-tabs-content-holder){padding:18px}.settings-tabs{flex-direction:column}.slide-preview{grid-template-columns:1fr 1fr}}
</style>
