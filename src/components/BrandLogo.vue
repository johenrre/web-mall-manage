<template>
  <span class="brand-logo" :aria-label="`${name} Logo`">
    <img v-if="src && !failed" :src="src" :alt="`${name} Logo`" @error="failed = true" />
    <span v-else aria-hidden="true">{{ initial }}</span>
  </span>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

const props = defineProps<{
  src?: string
  name: string
}>()

const failed = ref(false)
const initial = computed(() => String(props.name || '管').trim().slice(0, 1) || '管')

watch(() => props.src, () => {
  failed.value = false
})
</script>

<style scoped>
.brand-logo { display: grid; overflow: hidden; place-items: center; }
.brand-logo img { width: 100%; height: 100%; object-fit: cover; }
</style>
