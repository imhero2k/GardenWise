import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  OAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  createUserWithEmailAndPassword,
} from 'firebase/auth'
import { getFirebaseAuth, googleProvider, isFirebaseAuthConfigured } from '../auth/firebase'
import type { AuthState } from './authTypes'
import { AuthContext } from './AuthContextInternal'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(() =>
    isFirebaseAuthConfigured()
      ? { configured: true, loading: true, user: null, error: null }
      : { configured: false, loading: false, user: null, error: null },
  )

  useEffect(() => {
    if (!isFirebaseAuthConfigured()) {
      queueMicrotask(() => {
        setState({ configured: false, loading: false, user: null, error: null })
      })
      return
    }

    const auth = getFirebaseAuth()
    const unsub = onAuthStateChanged(
      auth,
      (user) => setState({ configured: true, loading: false, user, error: null }),
      (err) =>
        setState({
          configured: true,
          loading: false,
          user: null,
          error: err instanceof Error ? err.message : 'Auth error',
        }),
    )
    return () => unsub()
  }, [])

  const loginWithGoogle = useCallback(async () => {
    if (!isFirebaseAuthConfigured()) return
    setState((s) => (s.configured ? { ...s, loading: true, error: null } : s))
    const auth = getFirebaseAuth()
    try {
      await signInWithPopup(auth, googleProvider())
    } catch (e) {
      setState({
        configured: true,
        loading: false,
        user: null,
        error: e instanceof Error ? e.message : 'Sign-in failed',
      })
      throw e
    }
  }, [])

  const loginWithApple = useCallback(async () => {
    if (!isFirebaseAuthConfigured()) return
    setState((s) => (s.configured ? { ...s, loading: true, error: null } : s))
    const auth = getFirebaseAuth()
    try {
      const provider = new OAuthProvider('apple.com')
      await signInWithPopup(auth, provider)
    } catch (e) {
      setState({
        configured: true,
        loading: false,
        user: null,
        error: e instanceof Error ? e.message : 'Sign-in failed',
      })
      throw e
    }
  }, [])

  const loginWithEmail = useCallback(async (email: string, password: string) => {
    if (!isFirebaseAuthConfigured()) return
    setState((s) => (s.configured ? { ...s, loading: true, error: null } : s))
    const auth = getFirebaseAuth()
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch (e) {
      setState({
        configured: true,
        loading: false,
        user: null,
        error: e instanceof Error ? e.message : 'Sign-in failed',
      })
      throw e
    }
  }, [])

  const signUpWithEmail = useCallback(async (email: string, password: string) => {
    if (!isFirebaseAuthConfigured()) return
    setState((s) => (s.configured ? { ...s, loading: true, error: null } : s))
    const auth = getFirebaseAuth()
    try {
      await createUserWithEmailAndPassword(auth, email, password)
    } catch (e) {
      setState({
        configured: true,
        loading: false,
        user: null,
        error: e instanceof Error ? e.message : 'Sign-up failed',
      })
      throw e
    }
  }, [])

  const logout = useCallback(async () => {
    if (!isFirebaseAuthConfigured()) return
    const auth = getFirebaseAuth()
    await signOut(auth)
  }, [])

  const value = useMemo(
    () => ({ state, loginWithGoogle, loginWithApple, loginWithEmail, signUpWithEmail, logout }),
    [state, loginWithGoogle, loginWithApple, loginWithEmail, signUpWithEmail, logout],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Note: useAuth is exported from a separate file to satisfy react-refresh/only-export-components.

