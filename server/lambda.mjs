import serverlessExpress from '@vendia/serverless-express'
import { app } from './app.mjs'

// Node.js 24+ Lambda: exported handler must not use (event, context, callback).
const server = serverlessExpress({ app })

export const handler = async (event, context) => {
  // firebase-admin keeps HTTP keepalive sockets open after verifyIdToken; without
  // this, Lambda waits for an empty event loop and times out, causing API Gateway
  // to return a generic 500 even though Express already sent the response.
  context.callbackWaitsForEmptyEventLoop = false
  return server(event, context)
}

