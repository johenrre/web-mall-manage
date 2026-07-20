<template>
  <section class="json-card">
    <div class="json-heading"><div><h3>{{ title }}</h3><p>{{ description }}</p></div><a-space><a-tag v-if="error" color="error">格式错误</a-tag><a-tag v-else color="success">JSON 有效</a-tag><a-button size="small" @click="format"><AlignLeftOutlined/> 格式化</a-button></a-space></div>
    <a-textarea :value="modelValue" :rows="rows" class="json-input" spellcheck="false" @update:value="update" />
    <div v-if="error" class="json-error">{{ error }}</div>
  </section>
</template>

<script setup lang="ts">
import { ref,watch } from 'vue'
import { message } from 'ant-design-vue'
import { AlignLeftOutlined } from '@ant-design/icons-vue'
const props=withDefaults(defineProps<{modelValue:string;title:string;description:string;rows?:number}>(),{rows:8})
const emit=defineEmits<{ 'update:modelValue':[value:string] }>()
const error=ref('')
function validate(value:string){if(!value.trim()){error.value='';return true}try{const parsed=JSON.parse(value);if(typeof parsed!=='object'||parsed===null)throw new Error('JSON 顶层必须是数组或对象');error.value='';return true}catch(e){error.value=e instanceof Error?e.message:'JSON 格式错误';return false}}
function update(value:string){emit('update:modelValue',value);validate(value)}
function format(){if(!validate(props.modelValue))return message.error('请先修正 JSON 格式');if(!props.modelValue.trim())return;emit('update:modelValue',JSON.stringify(JSON.parse(props.modelValue),null,2))}
watch(()=>props.modelValue,validate,{immediate:true})
defineExpose({validate:()=>validate(props.modelValue)})
</script>

<style scoped>.json-card{padding:18px;border:1px solid #e6ece9;border-radius:14px;background:#fff}.json-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:12px}.json-heading h3{margin:0;color:#2c4b42;font-size:15px}.json-heading p{margin:4px 0 0;color:#8c9994;font-size:11px}.json-input{font-family:'SFMono-Regular',Consolas,monospace!important;font-size:12px;line-height:1.65}.json-error{margin-top:7px;color:#c0544e;font-size:11px}@media(max-width:650px){.json-heading{flex-direction:column}}</style>
