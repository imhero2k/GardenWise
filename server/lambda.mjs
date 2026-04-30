import serverlessExpress from '@vendia/serverless-express'
import { app } from './app.mjs'

// Node.js 24+ Lambda: exported handler must not use (event, context, callback).
const server = serverlessExpress({ app })

export const handler = async (event, context) => server(event, context)

