import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function SignInPage() {
  const { state, loginWithApple, loginWithEmail, loginWithGoogle, signUpWithEmail } = useAuth()
  const navigate = useNavigate()
  const [localError, setLocalError] = useState<string | null>(null)
  const [mode, setMode] = useState<'providers' | 'email-signin' | 'email-signup'>('providers')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  useEffect(() => {
    if (!state.loading && state.configured && state.user) {
      navigate('/', { replace: true })
    }
  }, [navigate, state.configured, state.loading, state.user])

  const handleGoogle = useCallback(async () => {
    setLocalError(null)
    try {
      await loginWithGoogle()
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : 'Sign-in failed')
    }
  }, [loginWithGoogle])

  const handleApple = useCallback(async () => {
    setLocalError(null)
    try {
      await loginWithApple()
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : 'Sign-in failed')
    }
  }, [loginWithApple])

  const handleEmail = useCallback(async () => {
    setLocalError(null)
    try {
      const e = email.trim()
      if (!e) throw new Error('Enter your email')
      if (!password) throw new Error('Enter your password')
      if (mode === 'email-signup') {
        await signUpWithEmail(e, password)
      } else {
        await loginWithEmail(e, password)
      }
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Sign-in failed')
    }
  }, [email, loginWithEmail, mode, password, signUpWithEmail])

  return (
    <section className="auth-wrap auth-in">
      <div className="auth-hero auth-hero--with-ill">
        <p className="eyebrow" style={{ marginBottom: 'var(--space-xs)' }}>
          Secure sign-in
        </p>
        <h1 style={{ margin: 0 }}>Welcome back</h1>
        <p className="auth-subtitle">Sign in to continue.</p>
      </div>

      <div className="card auth-card auth-card--in">
        <div className="card-body">
          {(localError || state.configured && state.error) && (
            <div className="auth-alert auth-alert--error" role="alert" style={{ marginBottom: 'var(--space-md)' }}>
              <strong>Couldn’t sign in.</strong> {localError || (state.configured ? state.error : '')}
            </div>
          )}

          {!state.configured && (
            <div className="auth-alert auth-alert--error" role="alert">
              <strong>Auth isn’t configured.</strong> Add Firebase config env vars, then reload.
            </div>
          )}

          {state.configured && (
            <>
              {mode === 'providers' && (
                <>
                  <button
                    type="button"
                    className="btn btn-primary btn-block"
                    onClick={() => void handleGoogle()}
                    disabled={state.loading}
                  >
                    {state.loading ? 'Checking session…' : 'Continue with Google'}
                  </button>

                  <button
                    type="button"
                    className="btn btn-secondary btn-block"
                    onClick={() => void handleApple()}
                    disabled={state.loading}
                    style={{ marginTop: 'var(--space-sm)' }}
                  >
                    Continue with Apple
                  </button>

                  <div className="auth-meta" style={{ marginTop: 'var(--space-md)' }}>
                    <button
                      type="button"
                      className="btn btn-ghost btn-block"
                      onClick={() => setMode('email-signin')}
                      disabled={state.loading}
                    >
                      Sign in with email
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-block"
                      onClick={() => setMode('email-signup')}
                      disabled={state.loading}
                      style={{ marginTop: 'var(--space-xs)' }}
                    >
                      Create an account
                    </button>
                  </div>
                </>
              )}

              {mode !== 'providers' && (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                      Email
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                        style={{
                          width: '100%',
                          marginTop: '0.35rem',
                          padding: '0.7rem 0.9rem',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--color-border)',
                        }}
                      />
                    </label>
                    <label style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                      Password
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete={mode === 'email-signup' ? 'new-password' : 'current-password'}
                        style={{
                          width: '100%',
                          marginTop: '0.35rem',
                          padding: '0.7rem 0.9rem',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--color-border)',
                        }}
                      />
                    </label>
                  </div>

                  <button
                    type="button"
                    className="btn btn-primary btn-block"
                    onClick={() => void handleEmail()}
                    disabled={state.loading}
                    style={{ marginTop: 'var(--space-md)' }}
                  >
                    {state.loading
                      ? 'Checking session…'
                      : mode === 'email-signup'
                        ? 'Create account'
                        : 'Sign in'}
                  </button>

                  <button
                    type="button"
                    className="btn btn-ghost btn-block"
                    onClick={() => setMode('providers')}
                    disabled={state.loading}
                    style={{ marginTop: 'var(--space-sm)' }}
                  >
                    Back
                  </button>
                </>
              )}

              <div className="auth-meta">
                <span>Encrypted sign-in · No password stored in the app</span>
              </div>

              <div className="auth-actions">
                <button
                  type="button"
                  className="btn btn-ghost btn-block"
                  onClick={() => navigate('/', { replace: true })}
                >
                  Back to Home
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="auth-footer">By continuing, you agree to sign in via Firebase Authentication.</div>
    </section>
  )
}
