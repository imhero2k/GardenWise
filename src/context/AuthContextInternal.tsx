import { createContext } from 'react'
import type { AuthState } from './authTypes'

export const AuthContext = createContext<{
  state: AuthState
  loginWithGoogle: () => Promise<void>
  loginWithApple: () => Promise<void>
  loginWithEmail: (email: string, password: string) => Promise<void>
  signUpWithEmail: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
} | null>(null)

