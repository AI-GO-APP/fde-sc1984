/**
 * Auth state management (Zustand)
 * Persists token to localStorage
 */
import { create } from 'zustand'
import type { AuthUser } from '../api/auth'

interface AuthState {
  token: string | null
  refreshToken: string | null
  user: AuthUser | null
  isLoggedIn: boolean
  setAuth: (token: string, refreshToken: string, user: AuthUser) => void
  logout: () => void
}

const STORAGE_KEY = 'auth'

function loadFromStorage(): Pick<AuthState, 'token' | 'refreshToken' | 'user' | 'isLoggedIn'> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const data = JSON.parse(raw)
      return { token: data.token, refreshToken: data.refreshToken, user: data.user, isLoggedIn: true }
    }
  } catch { /* ignore */ }
  return { token: null, refreshToken: null, user: null, isLoggedIn: false }
}

export const useAuthStore = create<AuthState>((set) => ({
  ...loadFromStorage(),

  setAuth: (token, refreshToken, user) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, refreshToken, user }))
    set({ token, refreshToken, user, isLoggedIn: true })
  },

  logout: () => {
    localStorage.removeItem(STORAGE_KEY)
    set({ token: null, refreshToken: null, user: null, isLoggedIn: false })
  },
}))
