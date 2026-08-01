<template>
  <div class="audio-uploader">
    <div class="audio-uploader__control">
      <a-input
        :value="modelValue"
        allow-clear
        placeholder="上传 MP3 或填写 HTTPS 音频地址"
        @update:value="emit('update:modelValue', $event)"
      />
      <a-upload
        :show-upload-list="false"
        accept=".mp3,audio/mpeg,audio/mp3"
        :before-upload="beforeUpload"
        :custom-request="upload"
      >
        <a-button :loading="loading"><UploadOutlined /> 上传 MP3</a-button>
      </a-upload>
    </div>
    <audio v-if="modelValue" class="audio-uploader__preview" controls preload="metadata" :src="resolveMedia(modelValue)">
      当前浏览器不支持音频试听。
    </audio>
    <div class="audio-uploader__hint">仅支持 MP3，最大 10 MB；建议使用 128–192 kbps，兼顾音质与加载速度。</div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { message } from 'ant-design-vue'
import { UploadOutlined } from '@ant-design/icons-vue'
import { errorMessage, uploadAudio } from '@/api/http'
import { resolveMedia } from '@/utils/format'

defineProps<{ modelValue: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
const loading = ref(false)

function beforeUpload(file: File) {
  const isMp3 = ['audio/mpeg', 'audio/mp3'].includes(file.type) || /\.mp3$/i.test(file.name)
  if (!isMp3) {
    message.error('仅支持 MP3 音频')
    return false
  }
  if (file.size > 10 * 1024 * 1024) {
    message.error('音频大小不能超过 10 MB')
    return false
  }
  return true
}

async function upload(options: any) {
  loading.value = true
  try {
    const result = await uploadAudio(options.file as File)
    emit('update:modelValue', result.url)
    message.success(result.source === 'oss' ? '音频已上传到阿里云 OSS' : '音频上传成功')
    options.onSuccess?.(result)
  } catch (error) {
    message.error(errorMessage(error))
    options.onError?.(error as Error)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.audio-uploader { display: flex; width: 100%; flex-direction: column; gap: 12px; }
.audio-uploader__control { display: grid; grid-template-columns: minmax(220px, 1fr) auto; gap: 10px; }
.audio-uploader__preview { width: min(100%, 520px); height: 38px; }
.audio-uploader__hint { color: #96a29d; font-size: 11px; line-height: 1.6; }
@media (max-width: 680px) {
  .audio-uploader__control { grid-template-columns: 1fr; }
  .audio-uploader__control :deep(.ant-btn) { width: 100%; }
}
</style>
