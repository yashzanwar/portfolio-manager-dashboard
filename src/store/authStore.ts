import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

const safeStorage = {
  getItem: (name: string) => {
    try {
      return globalThis.localStorage?.getItem(name) ?? null
    } catch {
      return null
    }
  },
  setItem: (name: string, value: string) => {
    try {
      globalThis.localStorage?.setItem(name, value)
    } catch {
      // Ignore storage failures (e.g. incognito restrictions)
    }
  },
  removeItem: (name: string) => {
    try {
      globalThis.localStorage?.removeItem(name)
    } catch {
      // Ignore storage failures
    }
  },
}

interface User {
  userId: number
  email: string
  fullName: string
}

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  _hasHydrated: boolean
  
  // Actions
  setAuth: (data: { user: User; accessToken: string; refreshToken: string }) => void
  setAccessToken: (token: string) => void
  logout: () => void
  setHasHydrated: (state: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      _hasHydrated: false,
      
      setAuth: (data) => set({
        user: data.user,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        isAuthenticated: true,
      }),
      
      setAccessToken: (token) => set({ accessToken: token }),
      
      logout: () => set({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
      }),
      
      setHasHydrated: (state) => set({ _hasHydrated: state }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => safeStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)

// Immediately mark as hydrated after store initialization
// This prevents infinite loading in incognito mode
setTimeout(() => {
  useAuthStore.setState({ _hasHydrated: true })
}, 0)
