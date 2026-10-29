#!/bin/sh
set -eu

output=/usr/share/nginx/html/runtime-config.js
temporary="${output}.tmp"

if [ -z "${APP_FIREBASE_API_KEY:-}" ] ||
  [ -z "${APP_FIREBASE_AUTH_DOMAIN:-}" ] ||
  [ -z "${APP_FIREBASE_PROJECT_ID:-}" ]; then
  echo "runtime-config: Firebase configuration is incomplete; authentication will be unavailable."
fi

jq -cnr \
  --arg apiBaseUrl "${APP_API_BASE_URL:-}" \
  --arg predictApiUrl "${APP_PREDICT_API_URL:-}" \
  --arg googleMapsApiKey "${APP_GOOGLE_MAPS_API_KEY:-}" \
  --arg firebaseApiKey "${APP_FIREBASE_API_KEY:-}" \
  --arg firebaseAuthDomain "${APP_FIREBASE_AUTH_DOMAIN:-}" \
  --arg firebaseProjectId "${APP_FIREBASE_PROJECT_ID:-}" \
  --arg firebaseAppId "${APP_FIREBASE_APP_ID:-}" \
  --arg firebaseMessagingSenderId "${APP_FIREBASE_MESSAGING_SENDER_ID:-}" \
  --arg firebaseStorageBucket "${APP_FIREBASE_STORAGE_BUCKET:-}" \
  --arg firebaseMeasurementId "${APP_FIREBASE_MEASUREMENT_ID:-}" \
  '{
    apiBaseUrl: $apiBaseUrl,
    predictApiUrl: $predictApiUrl,
    googleMapsApiKey: $googleMapsApiKey,
    firebaseApiKey: $firebaseApiKey,
    firebaseAuthDomain: $firebaseAuthDomain,
    firebaseProjectId: $firebaseProjectId,
    firebaseAppId: $firebaseAppId,
    firebaseMessagingSenderId: $firebaseMessagingSenderId,
    firebaseStorageBucket: $firebaseStorageBucket,
    firebaseMeasurementId: $firebaseMeasurementId
  } | "window.__APP_CONFIG__ = " + tojson + ";"' > "$temporary"

chmod 644 "$temporary"
mv "$temporary" "$output"
