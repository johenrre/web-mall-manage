<template>
  <main class="login-page">
    <section class="login-story">
      <div class="brand-mark">璞</div>
      <p class="eyebrow">PU GUANG STUDIO</p>
      <h1>让每一颗珠子，<br />都有被看见的秩序。</h1>
      <p class="story-copy">从订单履约到设计审核，在一处管理商城的日常运转。</p>
      <div class="feature-pills">
        <span>订单履约</span><span>珠材管理</span><span>内容运营</span>
      </div>
    </section>

    <section class="login-panel">
      <div class="login-card">
        <div class="mobile-brand"><span>璞</span> 璞光管理后台</div>
        <a-tag color="green" :bordered="false">ADMIN CONSOLE</a-tag>
        <h2>欢迎回来</h2>
        <p>请使用后台账号继续</p>

        <a-form layout="vertical" :model="form" @finish="submit">
          <a-form-item label="后台账号" name="username" :rules="[{ required: true, message: '请输入后台账号' }]">
            <a-input v-model:value="form.username" size="large" autocomplete="username" placeholder="请输入账号">
              <template #prefix><UserOutlined /></template>
            </a-input>
          </a-form-item>
          <a-form-item label="登录密码" name="password" :rules="[{ required: true, message: '请输入登录密码' }]">
            <a-input-password v-model:value="form.password" size="large" autocomplete="current-password" placeholder="请输入密码">
              <template #prefix><LockOutlined /></template>
            </a-input-password>
          </a-form-item>
          <a-button type="primary" html-type="submit" size="large" block :loading="loading">进入管理后台</a-button>
        </a-form>

        <div class="login-foot"><SafetyCertificateOutlined /> 安全登录 · 会话凭据不写入长期本地存储</div>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { LockOutlined, SafetyCertificateOutlined, UserOutlined } from '@ant-design/icons-vue'
import { errorMessage } from '@/api/http'
import { useAuth } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuth()
const loading = ref(false)
const form = reactive({ username: '', password: '' })

async function submit() {
  loading.value = true
  try {
    await auth.login(form.username.trim(), form.password)
    message.success('登录成功')
    await router.replace(String(route.query.redirect || '/stats'))
  } catch (error) {
    message.error(errorMessage(error))
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page { min-height: 100vh; display: grid; grid-template-columns: minmax(420px, 1.15fr) minmax(460px, .85fr); background: #f4f5f1; }
.login-story { position: relative; overflow: hidden; display: flex; flex-direction: column; justify-content: center; padding: 9vw; color: #f7f2e8; background: linear-gradient(145deg, rgba(10,46,38,.95), rgba(23,77,63,.88)), url('https://images.unsplash.com/photo-1611085583191-a3b181a88401?auto=format&fit=crop&w=1400&q=80') center/cover; }
.login-story::after { content: ''; position: absolute; inset: 22px; border: 1px solid rgba(255,255,255,.18); border-radius: 26px; pointer-events: none; }
.brand-mark { display: grid; place-items: center; width: 66px; height: 66px; margin-bottom: 24px; border: 1px solid rgba(255,255,255,.65); border-radius: 50%; font: 34px Georgia, serif; }
.eyebrow { margin: 0 0 20px; color: #d7c69e; font-size: 12px; letter-spacing: .3em; }
h1 { margin: 0; font: 700 clamp(40px,4.3vw,68px)/1.23 Georgia,'Noto Serif SC',serif; letter-spacing: -.04em; }
.story-copy { max-width: 500px; margin: 30px 0; color: rgba(255,255,255,.72); font-size: 16px; line-height: 1.8; }
.feature-pills { display: flex; flex-wrap: wrap; gap: 10px; }
.feature-pills span { padding: 8px 14px; border: 1px solid rgba(255,255,255,.22); border-radius: 99px; color: rgba(255,255,255,.78); font-size: 12px; }
.login-panel { display: grid; place-items: center; padding: 48px; }
.login-card { width: min(420px,100%); padding: 42px; border: 1px solid rgba(30,80,66,.08); border-radius: 24px; background: rgba(255,255,255,.84); box-shadow: 0 24px 60px rgba(21,57,47,.1); backdrop-filter: blur(15px); }
.login-card h2 { margin: 18px 0 6px; color: #183d32; font: 700 34px Georgia,'Noto Serif SC',serif; }
.login-card > p { margin: 0 0 30px; color: #7d8984; }
.login-foot { margin-top: 24px; color: #8a9792; font-size: 12px; text-align: center; }
.mobile-brand { display: none; }
@media(max-width:900px){.login-page{grid-template-columns:1fr}.login-story{display:none}.login-panel{padding:24px}.mobile-brand{display:flex;align-items:center;gap:10px;margin-bottom:24px;color:#254b40;font-weight:700}.mobile-brand span{display:grid;place-items:center;width:36px;height:36px;border-radius:50%;color:white;background:#1f6854}.login-card{padding:32px}}
</style>
