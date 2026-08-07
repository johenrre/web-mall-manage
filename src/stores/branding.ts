import { computed, reactive } from 'vue'
import { get } from '@/api/http'
import { resolveMedia } from '@/utils/format'

interface PublicBranding {
  appName?: string
  siteTitleLogoImage?: string
}

const state = reactive({
  appName: '小程序',
  logoUrl: '',
  loaded: false,
})

let loadingPromise: Promise<void> | null = null

async function load() {
  if (state.loaded) return
  if (!loadingPromise) {
    loadingPromise = get<PublicBranding>('/api/settings/branding')
      .then((data) => {
        const appName = String(data?.appName || '').trim()
        state.appName = appName || '小程序'
        state.logoUrl = resolveMedia(data?.siteTitleLogoImage)
      })
      .catch(() => {
        // 品牌接口不可用时保留通用名称，不能阻塞管理员登录。
      })
      .finally(() => {
        state.loaded = true
        loadingPromise = null
      })
  }
  await loadingPromise
}

export function useBranding() {
  const adminName = computed(() => `${state.appName}管理后台`)
  return { state, adminName, load }
}
