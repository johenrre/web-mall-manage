import axios, { type AxiosRequestConfig } from 'axios'

export const TOKEN_KEY = 'admin_session_token'

export interface ApiEnvelope<T> {
  code: number
  message: string
  data: T
}

export class ApiError extends Error {
  status?: number
  code?: number

  constructor(message: string, status?: number, code?: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

const baseURL = (import.meta.env.VITE_API_BASE || '').replace(/\/$/, '')

export const http = axios.create({
  baseURL,
  timeout: 20_000,
  withCredentials: true,
  headers: { Accept: 'application/json' },
})

http.interceptors.request.use((config) => {
  const token = sessionStorage.getItem(TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
    config.headers['X-Admin-Token'] = token
  }
  return config
})

http.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status as number | undefined
    const message = error.response?.data?.message || (status === 0 ? '网络连接失败' : error.message) || '请求失败'
    if (status === 401 || status === 403) {
      sessionStorage.removeItem(TOKEN_KEY)
      window.dispatchEvent(new CustomEvent('admin:unauthorized'))
    }
    return Promise.reject(new ApiError(message, status, error.response?.data?.code))
  },
)

export async function request<T>(config: AxiosRequestConfig): Promise<T> {
  const response = await http.request<ApiEnvelope<T>>(config)
  const payload = response.data
  if (!payload || payload.code !== 200) {
    throw new ApiError(payload?.message || '请求失败', response.status, payload?.code)
  }
  return payload.data
}

export function get<T>(url: string, params?: Record<string, unknown>) {
  return request<T>({ method: 'GET', url, params })
}

export function post<T>(url: string, data?: unknown) {
  return request<T>({ method: 'POST', url, data })
}

export interface UploadedImage {
  url: string
  path: string
  source: 'qiniu' | 'local'
  mime: string
  size: number
}

function normalizeUploadedImage(result: UploadedImage): UploadedImage {
  if (result.source !== 'local') return result
  try {
    const parsed = new URL(result.url, window.location.origin)
    const uploadPathIndex = parsed.pathname.indexOf('/uploads/')
    if (uploadPathIndex >= 0) {
      return {
        ...result,
        url: `${parsed.pathname.slice(uploadPathIndex)}${parsed.search}${parsed.hash}`,
      }
    }
  } catch {
    // 无法解析时保留后端原始地址，由页面展示具体错误。
  }
  return result
}

export async function uploadImage(file: File): Promise<UploadedImage> {
  if (file.size > 5 * 1024 * 1024) throw new ApiError('图片大小不能超过 5 MB')
  if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
    throw new ApiError('仅支持 JPG、PNG、GIF、WebP 图片')
  }
  const form = new FormData()
  form.append('file', file)
  const result = await request<UploadedImage>({
    method: 'POST',
    url: '/api/upload/image',
    data: form,
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return normalizeUploadedImage(result)
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : '操作失败，请稍后重试'
}
