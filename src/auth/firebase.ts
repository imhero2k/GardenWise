import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth'
import {
  getAppConfig,
  isFirebaseAuthConfigured as isRuntimeFirebaseAuthConfigured,
} from '../config/runtimeConfig'

let auth: Auth | null = null

export function isFirebaseAuthConfigured(): boolean {
  return isRuntimeFirebaseAuthConfigured()
}

export function getFirebaseAuth(): Auth {
  if (auth) return auth
  const runtimeConfig = getAppConfig()
  if (!isRuntimeFirebaseAuthConfigured(runtimeConfig)) {
    throw new Error('Firebase Authentication is not configured at runtime')
  }

  const app = initializeApp({
    apiKey: runtimeConfig.firebaseApiKey,
    authDomain: runtimeConfig.firebaseAuthDomain,
    projectId: runtimeConfig.firebaseProjectId,
    appId: runtimeConfig.firebaseAppId,
    measurementId: runtimeConfig.firebaseMeasurementId,
    storageBucket: runtimeConfig.firebaseStorageBucket,
    messagingSenderId: runtimeConfig.firebaseMessagingSenderId,
  })
  auth = getAuth(app)
  return auth
}

export function googleProvider() {
  return new GoogleAuthProvider()
}
