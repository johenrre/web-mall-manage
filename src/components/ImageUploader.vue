<template>
  <div class="uploader-row">
    <a-image v-if="modelValue" :src="resolveMedia(modelValue)" :width="58" :height="58" class="preview" />
    <div v-else class="empty-preview"><PictureOutlined /></div>
    <div class="uploader-main">
      <a-input :value="modelValue" placeholder="图片 URL" @update:value="emit('update:modelValue', $event)" />
      <a-upload :show-upload-list="false" accept="image/jpeg,image/png,image/gif,image/webp" :before-upload="beforeUpload" :custom-request="upload">
        <a-button size="small" :loading="loading"><UploadOutlined /> 上传图片</a-button>
      </a-upload>
      <span class="hint">JPG / PNG / GIF / WebP，最大 5 MB</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { message } from 'ant-design-vue'
import { PictureOutlined, UploadOutlined } from '@ant-design/icons-vue'
import { errorMessage, uploadImage } from '@/api/http'
import { resolveMedia } from '@/utils/format'

defineProps<{ modelValue: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
const loading = ref(false)

function beforeUpload(file: File) {
  if (file.size > 5 * 1024 * 1024) { message.error('图片大小不能超过 5 MB'); return false }
  return true
}

async function upload(options: any) {
  loading.value = true
  try {
    const result = await uploadImage(options.file as File)
    emit('update:modelValue', result.url)
    message.success(result.source === 'oss' ? '已上传到阿里云 OSS' : '图片上传成功')
    options.onSuccess?.(result)
  } catch (error) {
    message.error(errorMessage(error)); options.onError?.(error as Error)
  } finally { loading.value = false }
}
</script>

<style scoped>
.uploader-row{display:flex;align-items:flex-start;gap:12px}.preview,:deep(.preview img){border-radius:12px;object-fit:cover}.empty-preview{display:grid;place-items:center;flex:0 0 58px;height:58px;border:1px dashed #cad7d1;border-radius:12px;color:#a6b2ad;background:#f6f8f7}.uploader-main{display:grid;grid-template-columns:minmax(180px,1fr) auto;gap:7px;flex:1}.hint{grid-column:1/-1;color:#9aa6a1;font-size:11px}
</style>
