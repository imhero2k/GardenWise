export function runtimeConfigFromEnv(env = process.env) {
  return {
    apiBaseUrl: env.APP_API_BASE_URL?.trim() ?? '',
    predictApiUrl: env.APP_PREDICT_API_URL?.trim() ?? '',
    googleMapsApiKey: env.APP_GOOGLE_MAPS_API_KEY?.trim() ?? '',
    firebaseApiKey: env.APP_FIREBASE_API_KEY?.trim() ?? '',
    firebaseAuthDomain: env.APP_FIREBASE_AUTH_DOMAIN?.trim() ?? '',
    firebaseProjectId: env.APP_FIREBASE_PROJECT_ID?.trim() ?? '',
    firebaseAppId: env.APP_FIREBASE_APP_ID?.trim() ?? '',
    firebaseMessagingSenderId: env.APP_FIREBASE_MESSAGING_SENDER_ID?.trim() ?? '',
    firebaseStorageBucket: env.APP_FIREBASE_STORAGE_BUCKET?.trim() ?? '',
    firebaseMeasurementId: env.APP_FIREBASE_MEASUREMENT_ID?.trim() ?? '',
  }
}

export function serializeRuntimeConfig(env = process.env) {
  const config = JSON.stringify(runtimeConfigFromEnv(env))
  return `window.__APP_CONFIG__ = ${config};\n`
}
