import type { User } from 'firebase/auth'

export type AuthState =
  | { configured: false; loading: false; user: null; error: null }
  | { configured: true; loading: boolean; user: User | null; error: string | null }

