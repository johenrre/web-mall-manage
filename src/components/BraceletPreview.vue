<template>
  <div class="bracelet" :style="{ width: `${size}px`, height: `${size}px` }">
    <div v-if="!normalized.length" class="empty">无预览</div>
    <button
      v-for="(bead, index) in normalized"
      v-else
      :key="index"
      class="bead"
      :style="beadStyle(index, bead)"
      :title="bead.name || `珠子 ${index + 1}`"
      @click="$emit('select', bead)"
    >
      <img v-if="bead.image" :src="resolveMedia(bead.image)" alt="" />
    </button>
    <div v-if="normalized.length" class="center-mark">璞</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { resolveMedia } from '@/utils/format'

const props = withDefaults(defineProps<{ pattern?: any[] | string; materialMap?: Record<string, any>; size?: number }>(), { pattern: () => [], materialMap: () => ({}), size: 170 })
defineEmits<{ select: [bead: any] }>()

const normalized = computed(() => {
  let pattern: any[] = []
  try { pattern = Array.isArray(props.pattern) ? props.pattern : JSON.parse(props.pattern || '[]') } catch { pattern = [] }
  return pattern.map((item, index) => {
    const id = typeof item === 'object' ? (item.mat ?? item.materialId ?? item.material_id ?? item.id ?? item.code) : item
    const key = String(id ?? '').replace(/^dynamic_/, '')
    const material = props.materialMap[key] || props.materialMap[`dynamic_${key}`] || {}
    return { ...material, ...(typeof item === 'object' ? item : {}), id: key, index }
  })
})

function beadStyle(index: number, bead: any) {
  const count = normalized.value.length || 1
  const angle = (index / count) * Math.PI * 2 - Math.PI / 2
  const beadSize = Math.max(14, Math.min(28, Number(bead.size) || props.size * 0.115))
  const radius = props.size * 0.38
  const x = props.size / 2 + Math.cos(angle) * radius - beadSize / 2
  const y = props.size / 2 + Math.sin(angle) * radius - beadSize / 2
  return { width: `${beadSize}px`, height: `${beadSize}px`, transform: `translate(${x}px, ${y}px)`, background: bead.color || '#d8c4a4' }
}
</script>

<style scoped>
.bracelet{position:relative;flex:0 0 auto;border-radius:50%;background:radial-gradient(circle,rgba(32,86,71,.02) 36%,rgba(32,86,71,.06) 37%,transparent 40%)}.bead{position:absolute;left:0;top:0;padding:0;overflow:hidden;border:1px solid rgba(77,61,44,.18);border-radius:50%;box-shadow:0 2px 6px rgba(51,41,29,.18);cursor:pointer}.bead img{width:100%;height:100%;object-fit:cover}.center-mark{position:absolute;left:50%;top:50%;display:grid;place-items:center;width:34px;height:34px;transform:translate(-50%,-50%);border:1px solid #d7c498;border-radius:50%;color:#8a6a2f;font:17px Georgia,serif}.empty{position:absolute;inset:0;display:grid;place-items:center;color:#a4afa9;font-size:12px}
</style>
