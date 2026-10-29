import assert from 'node:assert/strict'
import test from 'node:test'
import { runtimeConfigFromEnv, serializeRuntimeConfig } from './runtime-config.mjs'

test('runtime config contains only whitelisted browser settings and safely serializes values', () => {
  const config = runtimeConfigFromEnv({
    APP_API_BASE_URL: 'https://api.example.test',
    APP_FIREBASE_AUTH_DOMAIN: 'garden.example.test";window.pwned=true;//',
    PLANTNET_API_KEY: 'must-not-be-exported',
  })

  assert.equal(config.apiBaseUrl, 'https://api.example.test')
  assert.equal(
    config.firebaseAuthDomain,
    'garden.example.test";window.pwned=true;//',
  )
  assert.equal('PLANTNET_API_KEY' in config, false)

  const serialized = serializeRuntimeConfig({
    APP_FIREBASE_AUTH_DOMAIN: '</script><script>alert(1)</script>',
    PLANTNET_API_KEY: 'must-not-be-exported',
  })
  assert.doesNotMatch(serialized, /PLANTNET_API_KEY|must-not-be-exported/)
  assert.equal(
    JSON.parse(serialized.match(/^window\.__APP_CONFIG__ = (.*);$/m)[1]).firebaseAuthDomain,
    '</script><script>alert(1)</script>',
  )
})

test('Firebase configuration is reported complete only when required fields are present', async () => {
  const { isFirebaseAuthConfigured } = await import('../src/config/runtimeConfig.ts')

  assert.equal(isFirebaseAuthConfigured({}), false)
  assert.equal(
    isFirebaseAuthConfigured({
      firebaseApiKey: 'public-api-key',
      firebaseAuthDomain: 'garden.example.test',
    }),
    false,
  )
  assert.equal(
    isFirebaseAuthConfigured({
      firebaseApiKey: 'public-api-key',
      firebaseAuthDomain: 'garden.example.test',
      firebaseProjectId: 'garden-project',
    }),
    true,
  )
  assert.equal(
    isFirebaseAuthConfigured({
      firebaseApiKey: ' ',
      firebaseAuthDomain: 'garden.example.test',
      firebaseProjectId: 'garden-project',
    }),
    false,
  )
})
