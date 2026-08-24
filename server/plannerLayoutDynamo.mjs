/**
 * Per-user planner layout document in DynamoDB.
 *
 * Table (create in AWS):
 *   Partition key: userId (String)
 *   Sort key: layoutId (String) — we use "default" for the single layout MVP.
 *
 * Env:
 *   DYNAMODB_PLANNER_LAYOUT_TABLE — table name (required for save/load)
 *   AWS_REGION — optional, default ap-southeast-2
 *
 * Lambda IAM: dynamodb:GetItem, dynamodb:PutItem on the table.
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb'

const region = String(process.env.AWS_REGION ?? 'ap-southeast-2').trim() || 'ap-southeast-2'
const tableName = String(process.env.DYNAMODB_PLANNER_LAYOUT_TABLE ?? '').trim()

/** @type {DynamoDBDocumentClient | null} */
let docClient = null

function getDocClient() {
  if (!docClient) {
    docClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region }), {
      marshallOptions: { removeUndefinedValues: true },
    })
  }
  return docClient
}

export function isPlannerLayoutTableConfigured() {
  return Boolean(tableName)
}

const DEFAULT_LAYOUT_ID = 'default'

/** @returns {Promise<Record<string, unknown> | null>} */
export async function getPlannerLayoutItem(userId) {
  const res = await getDocClient().send(
    new GetCommand({
      TableName: tableName,
      Key: { userId, layoutId: DEFAULT_LAYOUT_ID },
    }),
  )
  return res.Item ?? null
}

/**
 * @param {string} userId
 * @param {Record<string, unknown>} payload
 */
export async function putPlannerLayoutItem(userId, payload) {
  const updatedAt = new Date().toISOString()
  await getDocClient().send(
    new PutCommand({
      TableName: tableName,
      Item: {
        userId,
        layoutId: DEFAULT_LAYOUT_ID,
        payload,
        updatedAt,
      },
    }),
  )
  return { updatedAt }
}

export { DEFAULT_LAYOUT_ID }
