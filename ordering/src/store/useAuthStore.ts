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
  expiresAt: number | null
  isLoggedIn: boolean
  setAuth: (token: string, refreshToken: string, user: AuthUser, expiresInSeconds: number) => void
  logout: () => void
}

const STORAGE_KEY = 'auth'

function loadFromStorage(): Pick<AuthState, 'token' | 'refreshToken' | 'user' | 'expiresAt' | 'isLoggedIn'> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const data = JSON.parse(raw)
      if (data.expiresAt && Date.now() > data.expiresAt) {
        localStorage.removeItem(STORAGE_KEY)
        return { token: null, refreshToken: null, user: null, expiresAt: null, isLoggedIn: false }
      }
      return { token: data.token, refreshToken: data.refreshToken, user: data.user, expiresAt: data.expiresAt, isLoggedIn: true }
    }
  } catch { /* ignore */ }
  return { token: null, refreshToken: null, user: null, expiresAt: null, isLoggedIn: false }
}

export const useAuthStore = create<AuthState>((set) => ({
  ...loadFromStorage(),

  setAuth: (token, refreshToken, user, expiresInSeconds) => {
    const expiresAt = Date.now() + expiresInSeconds * 1000
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, refreshToken, user, expiresAt }))
    set({ token, refreshToken, user, expiresAt, isLoggedIn: true })
  },

  logout: () => {
    localStorage.removeItem(STORAGE_KEY)
    set({ token: null, refreshToken: null, user: null, expiresAt: null, isLoggedIn: false })
  },
}))
