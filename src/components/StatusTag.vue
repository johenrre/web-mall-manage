<template><a-tag :color="value.color" :bordered="false">{{ value.text }}</a-tag></template>

<script setup lang="ts">
import { computed } from 'vue'
const props = defineProps<{ status?: string; map: Record<string, { text: string; color: string }> }>()
const value = computed(() => props.map[props.status || ''] || { text: props.status || '未知', color: 'default' })
</script>
