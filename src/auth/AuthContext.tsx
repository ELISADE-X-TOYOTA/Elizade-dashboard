import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import type { AuthToken, UserProfile } from '../api/types'

const STORAGE_KEY = 'elizade_service_board_auth'

type AuthState = {
  token: string
  user: UserProfile
}

type AuthContextValue = {
  token: string | null
  user: UserProfile | null
  isAdmin: boolean
  signIn: (session: AuthToken) => void
  signOut: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function loadStored(): AuthState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as AuthState
    if (!parsed.token || !parsed.user?.role) return null
    return parsed
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthState | null>(() => loadStored())

  const signIn = useCallback((auth: AuthToken) => {
    if (auth.user.role === 'customer') {
      throw new Error('Customer accounts cannot access the Service Board.')
    }
    const next = { token: auth.accessToken, user: auth.user }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    setSession(next)
  }, [])

  const signOut = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setSession(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      token: session?.token ?? null,
      user: session?.user ?? null,
      isAdmin: session?.user.role === 'admin',
      signIn,
      signOut,
    }),
    [session, signIn, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
