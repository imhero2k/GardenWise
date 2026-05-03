/**
 * Firebase Admin SDK for verifying ID tokens on the API (DynamoDB-backed routes, etc.).
 *
 * Set one of:
 *   - FIREBASE_SERVICE_ACCOUNT_JSON — full JSON object as a string (typical on Lambda from Secrets Manager).
 *   - GOOGLE_APPLICATION_CREDENTIALS — path to a service account key file (common locally).
 */

import { readFileSync } from 'node:fs'
import admin from 'firebase-admin'

function ensureFirebaseAdminInitialized() {
  if (admin.apps.length > 0) return

  const jsonEnv = String(process.env.FIREBASE_SERVICE_ACCOUNT_JSON ?? '').trim()
  if (jsonEnv) {
    const parsed = JSON.parse(jsonEnv)
    admin.initializeApp({ credential: admin.credential.cert(parsed) })
    return
  }

  const path = String(process.env.GOOGLE_APPLICATION_CREDENTIALS ?? '').trim()
  if (path) {
    const parsed = JSON.parse(readFileSync(path, 'utf-8'))
    admin.initializeApp({ credential: admin.credential.cert(parsed) })
    return
  }

  throw new Error(
    'Firebase Admin is not configured. Set FIREBASE_SERVICE_ACCOUNT_JSON or GOOGLE_APPLICATION_CREDENTIALS.',
  )
}

/** @param {string} idToken */
export async function verifyFirebaseIdToken(idToken) {
  ensureFirebaseAdminInitialized()
  const decoded = await admin.auth().verifyIdToken(idToken)
  return String(decoded.uid)
}

export function isFirebaseAdminConfigured() {
  return (
    Boolean(String(process.env.FIREBASE_SERVICE_ACCOUNT_JSON ?? '').trim()) ||
    Boolean(String(process.env.GOOGLE_APPLICATION_CREDENTIALS ?? '').trim())
  )
}
