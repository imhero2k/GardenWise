import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

export function ProfilePage() {
  const { state, logout } = useAuth()
  const navigate = useNavigate()
  const [signingOut, setSigningOut] = useState(false)

  const handleSignOut = useCallback(async () => {
    setSigningOut(true)
    try {
      await logout()
      navigate('/signin', { replace: true })
    } catch {
      setSigningOut(false)
    }
  }, [logout, navigate])

  if (!state.configured) {
    return (
      <>
        <header className="page-header">
          <p className="eyebrow">Account</p>
          <h1>Profile</h1>
        </header>
        <section className="card card-body">
          <p style={{ margin: 0, color: 'var(--color-text-muted)' }}>
            Sign-in isn’t configured in this build.
          </p>
        </section>
      </>
    )
  }

  if (state.loading || !state.user) {
    return (
      <>
        <header className="page-header">
          <p className="eyebrow">Account</p>
          <h1>Profile</h1>
        </header>
        <p style={{ color: 'var(--color-text-muted)' }}>Loading account…</p>
      </>
    )
  }

  const u = state.user
  const label = u.displayName?.trim() || u.email || 'Signed in'

  return (
    <>
      <header className="page-header">
        <p className="eyebrow">Account</p>
        <h1>Profile</h1>
        <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>
          Your RootVio sign-in (Firebase).
        </p>
      </header>

      <section className="card card-body profile-page__card" style={{ maxWidth: 420 }}>
        <div className="profile-page__identity">
          {u.photoURL ? (
            <img
              src={u.photoURL}
              alt=""
              className="profile-page__avatar"
              width={72}
              height={72}
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="profile-page__avatar profile-page__avatar--placeholder" aria-hidden>
              {label.slice(0, 1).toUpperCase()}
            </div>
          )}
          <div>
            <p className="profile-page__name">{label}</p>
            {u.email && u.displayName ? (
              <p className="profile-page__email">{u.email}</p>
            ) : u.email ? (
              <p className="profile-page__email">{u.email}</p>
            ) : null}
          </div>
        </div>

        <button
          type="button"
          className="btn btn-secondary"
          style={{ marginTop: 'var(--space-md)' }}
          disabled={signingOut}
          onClick={() => void handleSignOut()}
        >
          {signingOut ? 'Signing out…' : 'Sign out'}
        </button>
      </section>
    </>
  )
}
