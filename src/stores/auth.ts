import { computed, reactive } from 'vue'
import { get, post, TOKEN_KEY } from '@/api/http'

export interface AdminUser {
  id: number
  username: string
  nickname?: string
  role: 'admin' | string
  avatar?: string
}

interface LoginResult {
  token: string
  user: AdminUser
}

const state = reactive({
  user: null as AdminUser | null,
  initialized: false,
  checking: false,
})

let bootstrapPromise: Promise<boolean> | null = null

export function useAuth() {
  const isAuthenticated = computed(() => state.user?.role === 'admin')

  async function login(username: string, password: string) {
    const result = await post<LoginResult>('/api/user/admin_login', { username, password })
    sessionStorage.setItem(TOKEN_KEY, result.token)
    state.user = result.user
    state.initialized = true
    return result.user
  }

  async function verify() {
    state.checking = true
    try {
      state.user = await get<AdminUser>('/api/user/verify')
      state.initialized = true
      return true
    } catch {
      sessionStorage.removeItem(TOKEN_KEY)
      state.user = null
      state.initialized = true
      return false
    } finally {
      state.checking = false
    }
  }

  function bootstrap() {
    if (state.initialized) return Promise.resolve(isAuthenticated.value)
    if (!bootstrapPromise) bootstrapPromise = verify().finally(() => (bootstrapPromise = null))
    return bootstrapPromise
  }

  async function logout() {
    try {
      await post('/api/user/logout')
    } catch {
      // 即使后端暂时不可达，也必须清理本地登录态。
    }
    sessionStorage.removeItem(TOKEN_KEY)
    state.user = null
    state.initialized = true
  }

  function clear() {
    sessionStorage.removeItem(TOKEN_KEY)
    state.user = null
    state.initialized = true
  }

  return { state, isAuthenticated, login, verify, bootstrap, logout, clear }
}
