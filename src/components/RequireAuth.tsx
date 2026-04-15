import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { state } = useAuth()
  useLocation() // keep hook for future (deep-link), but we always go Home after sign-in

  if (!state.configured) {
    return (
      <div className="card card-body">
        <h2 style={{ marginTop: 0 }}>Sign-in required</h2>
        <p style={{ margin: 0, color: 'var(--color-text-muted)' }}>
          Firebase Authentication is not configured for this build.
        </p>
      </div>
    )
  }

  if (state.loading) {
    return (
      <div className="card card-body">
        <p style={{ margin: 0, color: 'var(--color-text-muted)' }}>Checking sign-in…</p>
      </div>
    )
  }

  if (!state.user) {
    return <Navigate to="/signin" replace />
  }

  return <>{children}</>
}
