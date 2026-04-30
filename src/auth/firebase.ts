import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth'

let app: FirebaseApp | null = null
let auth: Auth | null = null

function required(name: keyof ImportMetaEnv): string {
  const v = import.meta.env[name]
  if (!v) throw new Error(`Missing required env: ${name}`)
  return v
}

export function isFirebaseAuthConfigured(): boolean {
  return Boolean(
    import.meta.env.VITE_FIREBASE_API_KEY &&
      import.meta.env.VITE_FIREBASE_AUTH_DOMAIN &&
      import.meta.env.VITE_FIREBASE_PROJECT_ID,
  )
}

export function getFirebaseAuth(): Auth {
  if (auth) return auth

  const cfg = {
    apiKey: required('VITE_FIREBASE_API_KEY'),
    authDomain: required('VITE_FIREBASE_AUTH_DOMAIN'),
    projectId: required('VITE_FIREBASE_PROJECT_ID'),
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  }

  app = initializeApp(cfg)
  auth = getAuth(app)
  return auth
}

export function googleProvider() {
  return new GoogleAuthProvider()
}

