<template>
  <a-modal :open="open" title="修改登录密码" ok-text="确认修改" cancel-text="取消" :confirm-loading="loading" @ok="submit" @cancel="close">
    <a-alert class="password-tip" type="info" show-icon message="修改成功后将退出当前会话，请使用新密码重新登录。" />
    <a-form ref="formRef" layout="vertical" :model="form" :rules="rules">
      <a-form-item label="当前密码" name="oldPassword">
        <a-input-password v-model:value="form.oldPassword" autocomplete="current-password" />
      </a-form-item>
      <a-form-item label="新密码" name="newPassword">
        <a-input-password v-model:value="form.newPassword" autocomplete="new-password" />
      </a-form-item>
      <a-form-item label="确认新密码" name="confirmPassword">
        <a-input-password v-model:value="form.confirmPassword" autocomplete="new-password" />
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { message, type FormInstance } from 'ant-design-vue'
import { post, errorMessage } from '@/api/http'

defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: []; changed: [] }>()
const formRef = ref<FormInstance>()
const loading = ref(false)
const form = reactive({ oldPassword: '', newPassword: '', confirmPassword: '' })
const rules = {
  oldPassword: [{ required: true, message: '请输入当前密码' }],
  newPassword: [{ required: true, message: '请输入新密码' }, { min: 6, message: '新密码至少 6 位' }],
  confirmPassword: [
    { required: true, message: '请再次输入新密码' },
    { validator: () => form.confirmPassword === form.newPassword ? Promise.resolve() : Promise.reject('两次密码不一致') },
  ],
}

function close() {
  formRef.value?.resetFields()
  emit('close')
}

async function submit() {
  try {
    await formRef.value?.validate()
    loading.value = true
    await post('/api/user/change_password', { old_password: form.oldPassword, new_password: form.newPassword })
    message.success('密码修改成功')
    emit('changed')
  } catch (error) {
    if (error instanceof Error) message.error(errorMessage(error))
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>.password-tip{margin-bottom:20px}</style>
