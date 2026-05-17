import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLocationArea } from '../context/LocationContext'
import { useAuth } from '../context/useAuth'

const GUEST_EMAIL = 'user123@mail.com'

export function SignInPage() {
  const { state, loginWithEmail, loginWithGoogle, signUpWithEmail } = useAuth()
  const { requestOpenLocationDialog } = useLocationArea()
  const navigate = useNavigate()
  const [localError, setLocalError] = useState<string | null>(null)
  const [mode, setMode] = useState<'guest' | 'signup'>('guest')
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

  const handleGuestContinue = useCallback(async () => {
    setLocalError(null)
    try {
      if (!password) throw new Error('Enter your password')
      await loginWithEmail(GUEST_EMAIL, password)
      requestOpenLocationDialog()
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Sign-in failed')
    }
  }, [loginWithEmail, password, requestOpenLocationDialog])

  const handleCreateAccount = useCallback(async () => {
    setLocalError(null)
    try {
      const e = email.trim()
      if (!e) throw new Error('Enter your email')
      if (!password) throw new Error('Enter your password')
      await signUpWithEmail(e, password)
      requestOpenLocationDialog()
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Sign-up failed')
    }
  }, [email, password, signUpWithEmail, requestOpenLocationDialog])

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
          {(localError || (state.configured && state.error)) && (
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
              <button
                type="button"
                className="btn btn-primary btn-block"
                onClick={() => void handleGoogle()}
                disabled={state.loading}
              >
                {state.loading ? 'Checking session…' : 'Continue with Google'}
              </button>

              {mode === 'guest' && (
                <>
                  <div className="auth-divider" aria-hidden>
                    <span>or</span>
                  </div>

                  <div className="auth-guest">
                    <label className="auth-guest__field">
                      Password
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                        placeholder="Enter password"
                        disabled={state.loading}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') void handleGuestContinue()
                        }}
                      />
                    </label>
                    <button
                      type="button"
                      className="btn btn-secondary btn-block"
                      onClick={() => void handleGuestContinue()}
                      disabled={state.loading}
                    >
                      {state.loading ? 'Checking session…' : 'Guest continue'}
                    </button>
                  </div>

                  <button
                    type="button"
                    className="btn btn-ghost btn-block"
                    onClick={() => {
                      setMode('signup')
                      setPassword('')
                      setLocalError(null)
                    }}
                    disabled={state.loading}
                    style={{ marginTop: 'var(--space-sm)' }}
                  >
                    Create an account
                  </button>
                </>
              )}

              {mode === 'signup' && (
                <div className="auth-signup">
                  <p className="auth-signup__heading">Create an account</p>
                  <label className="auth-guest__field">
                    Email
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      placeholder="you@example.com"
                      disabled={state.loading}
                    />
                  </label>
                  <label className="auth-guest__field">
                    Password
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="new-password"
                      placeholder="Choose a password"
                      disabled={state.loading}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') void handleCreateAccount()
                      }}
                    />
                  </label>
                  <button
                    type="button"
                    className="btn btn-primary btn-block"
                    onClick={() => void handleCreateAccount()}
                    disabled={state.loading}
                  >
                    {state.loading ? 'Creating account…' : 'Create account'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-block"
                    onClick={() => {
                      setMode('guest')
                      setEmail('')
                      setPassword('')
                      setLocalError(null)
                    }}
                    disabled={state.loading}
                    style={{ marginTop: 'var(--space-xs)' }}
                  >
                    Back
                  </button>
                </div>
              )}

              <div className="auth-meta">
                <span>Encrypted sign-in · No password stored in the app</span>
              </div>

            </>
          )}
        </div>
      </div>

      <div className="auth-footer">By continuing, you agree to sign in via Firebase Authentication.</div>
    </section>
  )
}
