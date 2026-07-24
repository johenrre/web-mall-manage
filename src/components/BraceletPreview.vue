<template>
  <div
    class="bracelet-preview"
    :style="{ width: `${size}px`, height: `${size}px` }"
    :aria-label="layout.beads.length ? `${layout.beads.length} 颗珠子的手串预览` : '空手串预览'"
  >
    <div v-if="!layout.beads.length" class="empty">无预览</div>
    <div
      v-else
      class="bracelet-preview__inner"
      :style="{
        width: `${layout.physicalSize}px`,
        height: `${layout.physicalSize}px`,
        transform: `scale(${layout.previewScale})`,
      }"
    >
      <div
        class="bracelet-preview__guide"
        :style="{
          width: `${layout.radius * 2}px`,
          height: `${layout.radius * 2}px`,
        }"
      />
      <div
        v-for="bead in layout.beads"
        :key="bead.key"
        class="bracelet-preview__bead"
        :style="bead.wrapperStyle"
        :title="bead.name"
        role="button"
        tabindex="0"
        @click="$emit('select', bead.source)"
        @keydown.enter="$emit('select', bead.source)"
      >
        <div class="bracelet-preview__rotator" :style="bead.rotatorStyle">
          <img
            v-if="bead.imageUrl"
            class="bracelet-preview__image"
            :src="resolveMedia(bead.imageUrl)"
            :alt="bead.name"
            loading="lazy"
            :style="bead.imageStyle"
          />
          <div v-else class="bracelet-preview__fallback" :style="bead.fallbackStyle" />
        </div>
      </div>
    </div>
    <div
      v-if="layout.beads.length"
      class="center-mark"
      :style="{
        width: `${centerMarkSize}px`,
        height: `${centerMarkSize}px`,
        fontSize: `${centerMarkFontSize}px`,
      }"
    >
      璞
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { resolveMedia } from '@/utils/format'

interface PreviewMaterial extends Record<string, unknown> {
  id: string
  name: string
  imageUrl: string
  sizeMm: number
  stringingWidthMm: number
  stringingPosition: 'center'|'top'
  stringingOffsetMm: number
  imageScale: number
  isIrregular: boolean
  layer: number
}

interface PreviewBead {
  key: string
  name: string
  imageUrl: string
  source: PreviewMaterial
  wrapperStyle: Record<string,string|number>
  rotatorStyle: Record<string,string>
  imageStyle: Record<string,string>
  fallbackStyle: Record<string,string>
}

interface PreviewLayout {
  beads: PreviewBead[]
  physicalSize: number
  previewScale: number
  radius: number
}

const props = withDefaults(defineProps<{
  pattern?: unknown[]|string
  materialMap?: Record<string,Record<string,unknown>>
  size?: number
}>(), {
  pattern: () => [],
  materialMap: () => ({}),
  size: 170,
})

defineEmits<{select:[bead:PreviewMaterial]}>()

const centerMarkSize=computed(()=>Math.max(16,Math.min(36,props.size*.12)))
const centerMarkFontSize=computed(()=>Math.max(9,Math.min(17,props.size*.058)))

function finiteNumber(value:unknown,fallback:number):number{
  const number=Number(value)
  return Number.isFinite(number)?number:fallback
}

function positiveNumber(value:unknown,fallback:number):number{
  const number=Number(value)
  return Number.isFinite(number)&&number>0?number:fallback
}

function booleanValue(value:unknown):boolean{
  if(typeof value==='boolean')return value
  if(typeof value==='number')return value!==0
  const normalized=String(value??'').trim().toLowerCase()
  return normalized==='1'||normalized==='true'||normalized==='yes'
}

function patternItems():unknown[]{
  if(Array.isArray(props.pattern))return props.pattern
  if(typeof props.pattern!=='string'||!props.pattern.trim())return []
  try{
    const value:unknown=JSON.parse(props.pattern)
    return Array.isArray(value)?value:[]
  }catch{
    return []
  }
}

function materialIdOf(item:unknown):string{
  if(item&&typeof item==='object'){
    const source=item as Record<string,unknown>
    return materialIdOf(source.mat??source.materialId??source.material_id??source.id??source.code)
  }
  return String(item??'').trim().replace(/^dynamic_/i,'')
}

function normalizeMaterial(item:unknown,index:number):PreviewMaterial{
  const id=materialIdOf(item)
  const material=props.materialMap[id]||props.materialMap[`dynamic_${id}`]||{}
  const overrides=item&&typeof item==='object'?item as Record<string,unknown>:{}
  const source={...material,...overrides}
  const sizeMm=positiveNumber(source.size??source.mm,11)
  const rawStringingWidth=Number(source.stringingWidthMm??source.stringing_width_mm)
  const stringingWidthMm=Number.isFinite(rawStringingWidth)&&rawStringingWidth>0
    ? rawStringingWidth
    : sizeMm
  const isIrregular=booleanValue(source.isIrregular??source.is_irregular)
  const rawLayer=source.layer
  const explicitLayer=Number(rawLayer)
  const layer=rawLayer!==undefined&&rawLayer!==null&&rawLayer!==''
    &&Number.isFinite(explicitLayer)
    ? explicitLayer
    : isIrregular?25:20
  const variants=Array.isArray(source.variants)
    ? source.variants.map(String).filter(Boolean)
    : []
  const displayImage=String(
    variants[index%Math.max(1,variants.length)]
    ||source.imageUrl
    ||source.previewUrl
    ||source.listImgUrl
    ||source.image
    ||'',
  ).trim()
  const canvasImage=String(
    source.canvasImageUrl
    ||source.canvas_image_url
    ||source.canvasImage
    ||source.canvas_image
    ||'',
  ).trim()

  return {
    ...source,
    id,
    name:String(source.name||'未知珠材'),
    imageUrl:canvasImage||displayImage,
    sizeMm,
    stringingWidthMm,
    stringingPosition:String(source.stringingPosition??source.stringing_position).toLowerCase()==='top'
      ?'top'
      :'center',
    stringingOffsetMm:finiteNumber(
      source.stringingOffsetMm??source.stringing_offset_mm,
      0,
    ),
    imageScale:positiveNumber(
      source.imageScale??source.image_scale??source.imgScale??source.img_scale,
      1,
    ),
    isIrregular,
    layer,
  }
}

function fallbackStyle(materialId:string):Record<string,string>{
  const hash=materialId.split('').reduce((total,character)=>total+character.charCodeAt(0),0)
  const hue=hash%360
  return {
    background:`radial-gradient(circle at 34% 30%,hsl(${hue} 42% 94%),hsl(${hue} 34% 68%) 58%,hsl(${hue} 28% 48%))`,
  }
}

const layout=computed<PreviewLayout>(()=>{
  const materials=patternItems()
    .map((item,index)=>normalizeMaterial(item,index))
    .filter(material=>material.id)
  if(materials.length===0){
    return{beads:[],physicalSize:Math.max(1,props.size),previewScale:1,radius:0}
  }

  const circumference=materials.reduce((total,material)=>total+material.stringingWidthMm,0)
  const materialCount=Math.max(1,materials.length)
  const radius=materialCount>=3
    ?circumference/(2*materialCount*Math.sin(Math.PI/materialCount))
    :materials[0].sizeMm
  const maxVisualDiameter=materials.reduce((largest,material)=>(
    Math.max(largest,material.sizeMm*material.imageScale)
  ),11)
  const maxRadialOffset=materials.reduce((largest,material)=>(
    Math.max(largest,Math.abs(material.stringingOffsetMm))
  ),0)
  const physicalSize=Math.max(
    1,
    (radius*2+maxVisualDiameter+maxRadialOffset*2)*1.1,
  )
  const previewScale=props.size/physicalSize
  let accumulatedAngle=0

  const beads=materials.map((material,index)=>{
    const angleSpan=circumference>0
      ?material.stringingWidthMm/circumference*Math.PI*2
      :Math.PI*2/materials.length
    const angle=accumulatedAngle+angleSpan/2-Math.PI/2
    accumulatedAngle+=angleSpan

    const diameter=material.sizeMm
    const stringingRadius=Math.max(0,radius+material.stringingOffsetMm)
    const anchorY=material.stringingPosition==='top'
      ?Math.min(diameter,material.stringingWidthMm/2)
      :diameter/2
    const centerX=physicalSize/2+Math.cos(angle)*stringingRadius
    const centerY=physicalSize/2+Math.sin(angle)*stringingRadius
    const rotation=angle-Math.PI/2

    return{
      key:`${material.id}_${index}`,
      name:material.name,
      imageUrl:material.imageUrl,
      source:material,
      wrapperStyle:{
        width:`${diameter}px`,
        height:`${diameter}px`,
        left:`${centerX-diameter/2}px`,
        top:`${centerY-anchorY}px`,
        zIndex:Math.round(material.layer*10000+centerY),
      },
      rotatorStyle:{
        transformOrigin:`${diameter/2}px ${anchorY}px`,
        transform:`rotate(${rotation}rad)`,
      },
      imageStyle:{
        transform:`scale(${material.imageScale})`,
      },
      fallbackStyle:fallbackStyle(material.id),
    }
  })

  return{beads,physicalSize,previewScale,radius}
})
</script>

<style scoped>
.bracelet-preview{position:relative;display:flex;align-items:center;justify-content:center;flex:0 0 auto;overflow:visible;border-radius:50%;background:radial-gradient(circle,rgba(32,86,71,.02) 36%,rgba(32,86,71,.055) 37%,transparent 40%)}.bracelet-preview__inner{position:relative;flex:0 0 auto;transform-origin:center}.bracelet-preview__guide{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);border:1px solid rgba(66,104,92,.075);border-radius:50%;box-shadow:0 2px 8px rgba(36,71,61,.04)}.bracelet-preview__bead{position:absolute;display:flex;align-items:center;justify-content:center;outline:none;cursor:pointer}.bracelet-preview__rotator{position:relative;width:100%;height:100%}.bracelet-preview__image{display:block;width:100%;height:100%;object-fit:contain;transform-origin:center;filter:drop-shadow(0 1px 1.5px rgba(43,34,24,.2))}.bracelet-preview__fallback{width:100%;height:100%;border:1px solid rgba(77,61,44,.14);border-radius:50%;box-shadow:0 1px 3px rgba(51,41,29,.15)}.center-mark{position:absolute;z-index:300000;top:50%;left:50%;display:grid;place-items:center;transform:translate(-50%,-50%);border:1px solid #d7c498;border-radius:50%;color:#8a6a2f;background:rgba(255,255,255,.82);font-family:Georgia,serif}.empty{position:absolute;inset:0;display:grid;place-items:center;color:#a4afa9;font-size:12px}
</style>
