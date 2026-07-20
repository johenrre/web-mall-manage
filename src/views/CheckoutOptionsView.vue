<template>
  <div class="page-shell">
    <PageHeader title="定制选项" description="配置结算页的制作、包装、绳色、快递与附加服务">
      <a-button @click="resetDefaults"><UndoOutlined /> 恢复默认</a-button>
      <a-button type="primary" :loading="saving" @click="save"><SaveOutlined /> 保存并发布</a-button>
    </PageHeader>
    <a-alert type="info" show-icon message="每个分组需要唯一编码和一个默认选项；免费选项的加价会自动归零。" />
    <a-skeleton v-if="loading" active :paragraph="{rows:10}" />
    <template v-else>
      <a-collapse v-model:active-key="expanded" class="option-collapse" :bordered="false">
        <a-collapse-panel v-for="(group,groupIndex) in groups" :key="group.uid" class="group-panel">
          <template #header><div class="group-header"><span class="group-index">{{ groupIndex+1 }}</span><div><b>{{ group.title||'未命名分组' }}</b><small>{{ group.groupCode }} · {{ group.options.length }} 个选项</small></div></div></template>
          <template #extra><a-popconfirm title="确认删除整个分组？" @confirm="removeGroup(groupIndex)"><a-button type="text" danger size="small" @click.stop><DeleteOutlined /></a-button></a-popconfirm></template>
          <div class="group-config form-grid"><a-form-item label="分组标题"><a-input v-model:value="group.title" placeholder="例如：开光服务"/></a-form-item><a-form-item label="分组编码"><a-input v-model:value="group.groupCode" placeholder="例如：blessing"/></a-form-item></div>
          <div class="option-list">
            <article v-for="(option,optionIndex) in group.options" :key="option.uid" class="option-card" :class="{selected:group.selectedOptionCode===option.optionCode}">
              <button class="default-radio" @click="group.selectedOptionCode=option.optionCode"><CheckCircleFilled v-if="group.selectedOptionCode===option.optionCode"/><span v-else></span><small>默认</small></button>
              <div class="option-fields">
                <a-input v-model:value="option.title" placeholder="选项名称"/>
                <a-input v-model:value="option.optionCode" placeholder="选项编码"/>
                <a-input v-model:value="option.subtitle" placeholder="选项说明"/>
                <a-input v-model:value="option.image" placeholder="图片 URL（可选）"/>
                <a-input-number v-model:value="option.amount" :min="0" :precision="2" prefix="¥" :disabled="option.isFree" style="width:100%"/>
                <a-checkbox v-model:checked="option.isFree" @change="option.isFree&&(option.amount=0)">免费</a-checkbox>
              </div>
              <a-button type="text" danger @click="removeOption(groupIndex,optionIndex)"><DeleteOutlined/></a-button>
            </article>
          </div>
          <a-button type="dashed" block @click="addOption(groupIndex)"><PlusOutlined/> 新增选项</a-button>
        </a-collapse-panel>
      </a-collapse>
      <a-button class="add-group" type="dashed" size="large" block @click="addGroup"><PlusOutlined/> 新增定制分组</a-button>
    </template>
  </div>
</template>

<script setup lang="ts">
import { onMounted,ref } from 'vue'
import { message,Modal } from 'ant-design-vue'
import { CheckCircleFilled,DeleteOutlined,PlusOutlined,SaveOutlined,UndoOutlined } from '@ant-design/icons-vue'
import PageHeader from '@/components/PageHeader.vue'
import { errorMessage,get,post } from '@/api/http'
interface Option{uid?:string;optionCode:string;title:string;subtitle:string;amount:number;isFree:boolean;image?:string}interface Group{uid:string;groupCode:string;title:string;selectedOptionCode:string;options:Option[]}
const uid=()=>Math.random().toString(36).slice(2)
const defaults:Omit<Group,'uid'>[]=[
  {groupCode:'productionMethod',title:'制作方式',selectedOptionCode:'assembled',options:[{optionCode:'diy',title:'自己动手',subtitle:'仅购买当前设计所需珠子',amount:0,isFree:true},{optionCode:'assembled',title:'串好成品',subtitle:'由工坊按当前设计串好后发出',amount:9.9,isFree:false}] as Option[]},
  {groupCode:'packaging',title:'包装方式',selectedOptionCode:'gift',options:[{optionCode:'normal',title:'普通包装',subtitle:'随单附基础收纳包装',amount:0,isFree:true},{optionCode:'gift',title:'礼盒包装',subtitle:'适合作为礼物赠送',amount:10,isFree:false}] as Option[]},
  {groupCode:'ropeColor',title:'选择绳线颜色',selectedOptionCode:'001',options:['红色','黑色','淡蓝色','白色','紫色','橙色','粉色','绿色'].map((title,index)=>({optionCode:String(index+1).padStart(3,'0'),title,subtitle:'',amount:2,isFree:false,image:`/uploads/images/${String(index+1).padStart(3,'0')}_${title}.png`}))},
  {groupCode:'shipping',title:'快递选择',selectedOptionCode:'yunda',options:[{optionCode:'yunda',title:'韵达快递',subtitle:'',amount:9,isFree:false},{optionCode:'sf',title:'顺丰快递',subtitle:'',amount:18,isFree:false}] as Option[]},
]
const loading=ref(false),saving=ref(false),groups=ref<Group[]>([]),expanded=ref<string[]>([])
function hydrate(input:any[]):Group[]{return input.map(group=>({...group,uid:uid(),options:(Array.isArray(group.options)?group.options:[]).map((option:any)=>({subtitle:'',amount:0,isFree:false,...option,uid:uid()}))}))}
async function load(){loading.value=true;try{const data:any=await get('/api/admin/settings_get');let parsed=[];try{parsed=JSON.parse(data.miniprogram_checkout_item_options_json||'[]')}catch{}groups.value=hydrate(Array.isArray(parsed)&&parsed.length?parsed:defaults);expanded.value=groups.value.map(x=>x.uid)}catch(e){message.error(errorMessage(e));groups.value=hydrate(defaults)}finally{loading.value=false}}
function addGroup(){const group:Group={uid:uid(),groupCode:`group_${Date.now()}`,title:'新定制服务',selectedOptionCode:'none',options:[{uid:uid(),optionCode:'none',title:'不需要',subtitle:'',amount:0,isFree:true}]};groups.value.push(group);expanded.value.push(group.uid)}
function removeGroup(index:number){groups.value.splice(index,1)}
function addOption(groupIndex:number){groups.value[groupIndex]!.options.push({uid:uid(),optionCode:`option_${Date.now()}`,title:'新选项',subtitle:'',amount:0,isFree:true})}
function removeOption(groupIndex:number,optionIndex:number){const group=groups.value[groupIndex]!,removed=group.options[optionIndex];group.options.splice(optionIndex,1);if(group.selectedOptionCode===removed?.optionCode)group.selectedOptionCode=group.options[0]?.optionCode||''}
function resetDefaults(){Modal.confirm({title:'恢复默认定制选项？',content:'当前未保存的修改会丢失。',onOk(){groups.value=hydrate(defaults);expanded.value=groups.value.map(x=>x.uid)}})}
async function save(){const codes=groups.value.map(x=>x.groupCode.trim());if(groups.value.some(x=>!x.title.trim()||!x.groupCode.trim()||!x.options.length))return message.warning('每个分组都需要标题、编码和至少一个选项');if(new Set(codes).size!==codes.length)return message.warning('分组编码不能重复');for(const group of groups.value){const optionCodes=group.options.map(x=>x.optionCode.trim());if(group.options.some(x=>!x.title.trim()||!x.optionCode.trim()))return message.warning(`“${group.title}”存在空的名称或编码`);if(new Set(optionCodes).size!==optionCodes.length)return message.warning(`“${group.title}”的选项编码不能重复`);if(!optionCodes.includes(group.selectedOptionCode))group.selectedOptionCode=optionCodes[0]!}saving.value=true;try{const payload=groups.value.map(({uid:_,options,...group})=>({...group,options:options.map(({uid:__,...option})=>({...option,amount:option.isFree?0:Number(option.amount||0)}))}));await post('/api/admin/settings_update',{miniprogram_checkout_item_options_json:JSON.stringify(payload)});message.success('定制选项已保存并发布')}catch(e){message.error(errorMessage(e))}finally{saving.value=false}}
onMounted(load)
</script>

<style scoped>
.option-collapse{background:transparent}.group-panel{margin-bottom:14px;overflow:hidden;border:1px solid rgba(30,89,73,.1)!important;border-radius:16px!important;background:#fff;box-shadow:0 8px 26px rgba(23,67,56,.045)}.group-header{display:flex;align-items:center;gap:12px}.group-index{display:grid;place-items:center;width:30px;height:30px;border-radius:9px;color:#2d6a59;background:#e9f3ef;font-weight:700}.group-header>div{display:flex;flex-direction:column}.group-header small{color:#9aa6a1;font-size:10px}.group-config{padding-top:8px}.option-list{display:flex;flex-direction:column;gap:10px;margin-bottom:12px}.option-card{display:grid;grid-template-columns:52px 1fr 36px;align-items:center;gap:12px;padding:12px;border:1px solid #e7ecea;border-radius:12px;background:#fafbfa}.option-card.selected{border-color:#84ac9e;background:#f2f8f5}.default-radio{display:flex;flex-direction:column;align-items:center;gap:3px;border:0;color:#2c705d;background:transparent;cursor:pointer}.default-radio>span{width:16px;height:16px;border:1px solid #b8c5c0;border-radius:50%}.default-radio small{font-size:9px}.option-fields{display:grid;grid-template-columns:1fr 1fr 1.3fr 1.3fr 110px 58px;align-items:center;gap:8px}.add-group{height:56px;margin-top:4px}
@media(max-width:1100px){.option-fields{grid-template-columns:repeat(2,1fr)}}@media(max-width:600px){.option-card{grid-template-columns:42px 1fr 32px}.option-fields{grid-template-columns:1fr}}
</style>
