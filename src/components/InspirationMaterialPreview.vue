<template>
  <article class="inspiration-preview" aria-label="小程序灵感页实时渲染预览">
    <div class="inspiration-preview__media">
      <img
        v-if="trayBackgroundUrl && !trayLoadFailed"
        class="inspiration-preview__tray"
        :src="resolveMedia(trayBackgroundUrl)"
        alt=""
        @error="trayLoadFailed=true"
      >
      <div v-else class="inspiration-preview__tray-fallback" aria-hidden="true">
        <span />
      </div>
      <div class="inspiration-preview__bracelet">
        <BraceletPreview
          :pattern="previewPattern"
          :material-map="previewMaterialMap"
          :size="316"
          :bead-size="11"
        />
      </div>
      <span class="inspiration-preview__live"><i />实时预览</span>
    </div>

    <div class="inspiration-preview__body">
      <div class="inspiration-preview__heading">
        <strong>{{ materialName }}</strong>
        <b>{{ priceText }}</b>
      </div>
      <div class="inspiration-preview__author">
        <span class="inspiration-preview__avatar">调</span>
        <span>小程序灵感页计算方式</span>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed,ref,watch } from 'vue'
import BraceletPreview from '@/components/BraceletPreview.vue'
import { resolveMedia } from '@/utils/format'

interface MaterialPreviewInput extends Record<string,unknown> {
  id?: string|number
  name?: string
  size?: number
  price?: number
  image?: string
  canvas_image?: string
  stringing_width_mm?: number|null
  stringing_position?: 'center'|'top'
  stringing_offset_mm?: number
  image_scale?: number
  is_irregular?: boolean
  layer?: number|null
}

const props=withDefaults(defineProps<{
  material?: MaterialPreviewInput
  referenceMaterials?: MaterialPreviewInput[]
  referenceSize?: number
  trayBackgroundUrl?: string
}>(),{
  material:()=>({}),
  referenceMaterials:()=>[],
  referenceSize:10,
  trayBackgroundUrl:'',
})

const trayLoadFailed=ref(false)
watch(()=>props.trayBackgroundUrl,()=>{trayLoadFailed.value=false})

const targetId='__editing_material__'
const fallbackReferenceId='__reference_bead__'

function finiteNumber(value:unknown,fallback:number):number{
  const number=Number(value)
  return Number.isFinite(number)?number:fallback
}

const materialName=computed(()=>String(props.material.name||'未命名珠材').trim()||'未命名珠材')
const priceText=computed(()=>`¥ ${Math.max(0,finiteNumber(props.material.price,0)).toFixed(2)}`)
const normalizedReferenceSize=computed(()=>Math.max(.1,finiteNumber(props.referenceSize,10)))
const referenceEntries=computed(()=>props.referenceMaterials
  .filter(item=>String(item.image||item.canvas_image||'').trim())
  .slice(0,5)
  .map((item,index)=>({
    id:`__reference_bead_${index}__`,
    material:{
      ...item,
      id:`__reference_bead_${index}__`,
      name:String(item.name||`真实参考珠 ${index+1}`),
      size:normalizedReferenceSize.value,
      // Use one explicit cutout for every size. Catalogue variants describe
      // prices/sizes and must never be interpreted as image URL variants.
      canvas_image:String(item.canvas_image||item.image||''),
      image:String(item.canvas_image||item.image||''),
      variants:[],
      stringing_width_mm:null,
      stringing_position:'center',
      stringing_offset_mm:0,
      image_scale:1,
      is_irregular:false,
      layer:10,
    } as Record<string,unknown>,
  })))
const referenceIds=computed(()=>referenceEntries.value.length
  ?referenceEntries.value.map(item=>item.id)
  :[fallbackReferenceId])
const previewPattern=computed(()=>[
  targetId,
  ...Array.from({length:17},(_,index)=>referenceIds.value[index%referenceIds.value.length]),
])
const previewMaterialMap=computed<Record<string,Record<string,unknown>>>(()=>{
  const referenceMap=Object.fromEntries(referenceEntries.value.map(item=>[item.id,item.material]))
  return{
    [targetId]:{
    ...props.material,
    id:targetId,
    name:materialName.value,
    size:Math.max(.1,finiteNumber(props.material.size,8)),
    },
    [fallbackReferenceId]:{
    id:fallbackReferenceId,
    name:`${normalizedReferenceSize.value} mm 参考珠`,
    size:normalizedReferenceSize.value,
    price:0,
    image:'',
    canvas_image:'',
    stringing_width_mm:null,
    stringing_position:'center',
    stringing_offset_mm:0,
    image_scale:1,
    is_irregular:false,
    layer:10,
    },
    ...referenceMap,
  }
})
</script>

<style scoped>
.inspiration-preview{width:100%;max-width:420px;overflow:visible;color:#172f2d;background:transparent}.inspiration-preview__media{position:relative;width:100%;aspect-ratio:160/163;overflow:hidden;border:1px solid rgba(90,111,105,.12);border-radius:24px;background:#edf3f1;box-shadow:0 16px 38px rgba(41,70,62,.12)}.inspiration-preview__tray{position:absolute;z-index:0;top:50%;left:50%;width:88%;height:88%;object-fit:contain;transform:translate(-50%,-50%)}.inspiration-preview__tray-fallback{position:absolute;inset:6%;display:grid;place-items:center;border-radius:50%;background:radial-gradient(circle at 48% 42%,#fbfcfb 0 46%,#dbe5e1 47% 49%,#f2f5f3 50% 65%,#c8d5d0 66% 69%,transparent 70%);filter:drop-shadow(0 10px 16px rgba(46,72,64,.14))}.inspiration-preview__tray-fallback span{width:36%;height:36%;border:1px solid rgba(74,103,94,.12);border-radius:50%;background:rgba(255,255,255,.5)}.inspiration-preview__bracelet{position:absolute;z-index:1;inset:0;display:flex;align-items:center;justify-content:center}.inspiration-preview__live{position:absolute;z-index:2;top:18px;right:18px;display:flex;align-items:center;height:30px;padding:0 12px;border:1px solid rgba(255,255,255,.45);border-radius:999px;color:#fff;background:rgba(31,58,54,.9);box-shadow:0 4px 12px rgba(20,42,39,.14);font-size:11px;font-weight:600;letter-spacing:1px}.inspiration-preview__live i{width:6px;height:6px;margin-right:6px;border-radius:50%;background:#8de1b8;box-shadow:0 0 0 4px rgba(141,225,184,.13)}.inspiration-preview__body{padding:18px 5px 0}.inspiration-preview__heading{display:flex;align-items:baseline;justify-content:space-between;min-width:0;gap:12px}.inspiration-preview__heading strong{min-width:0;overflow:hidden;color:#213b36;font-family:"Songti SC","STSong",serif;font-size:20px;font-weight:600;letter-spacing:1px;text-overflow:ellipsis;white-space:nowrap}.inspiration-preview__heading b{flex:0 0 auto;color:#296452;font-size:15px}.inspiration-preview__author{display:flex;align-items:center;min-width:0;min-height:24px;margin-top:10px;color:#71817c;font-size:12px;gap:8px}.inspiration-preview__avatar{display:grid;width:22px;height:22px;place-items:center;border-radius:50%;color:#3d6c5e;background:#e1e9e5;font-size:10px;font-weight:700}
@media(prefers-reduced-motion:reduce){.inspiration-preview__live i{box-shadow:none}}
</style>
