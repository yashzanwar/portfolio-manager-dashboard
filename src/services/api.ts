import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '../store/authStore'
import { AuthService } from './auth.service'
import type { QueryClient } from '@tanstack/react-query'

const API_BASE_URL = 'http://127.0.0.1:8080/api'

// Store queryClient reference for logout
let queryClientRef: QueryClient | null = null

export function setQueryClientForApi(queryClient: QueryClient) {
  queryClientRef = queryClient
}

// Global logout function that clears both auth and cache
export function performGlobalLogout() {
  const { logout } = useAuthStore.getState()
  logout()
  if (queryClientRef) {
    queryClientRef.clear()
  }
}

// Create axios instance
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const { accessToken } = useAuthStore.getState()
    
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`
    }
    
    // If the request data is FormData, remove the Content-Type header
    // to let the browser set it with the correct boundary
    if (config.data instanceof FormData) {
      delete (config.headers as any)['Content-Type']
    }
    
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor for token refresh
let isRefreshing = false
let failedQueue: Array<{
  resolve: (value?: unknown) => void
  reject: (reason?: unknown) => void
}> = []

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })

  failedQueue = []
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    // If error is 401 and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`
            }
            return apiClient(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      const { refreshToken, setAccessToken } = useAuthStore.getState()

      if (!refreshToken) {
        performGlobalLogout()
        return Promise.reject(error)
      }

      try {
        const { token: newAccessToken } = await AuthService.refreshToken(refreshToken)
        setAccessToken(newAccessToken)
        
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
        }

        processQueue(null, newAccessToken)
        isRefreshing = false

        return apiClient(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError as Error, null)
        performGlobalLogout()
        globalThis.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)
