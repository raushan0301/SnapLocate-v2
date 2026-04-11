import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { v4 as uuidv4 } from 'uuid'
import dotenv from 'dotenv'
dotenv.config()

// Cloudflare R2 is S3-compatible
export const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId:     process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
})

const BUCKET = process.env.R2_BUCKET_NAME || 'snaplocate-files'
const PUBLIC_URL = process.env.R2_PUBLIC_URL

/**
 * Generate a presigned PUT URL for direct client upload to R2
 * @param {string} fileName - original file name
 * @param {string} contentType - MIME type
 * @param {string} folder - subfolder in R2 bucket (e.g. 'resources', 'notes')
 * @returns {{ uploadUrl: string, fileUrl: string, key: string }}
 */
export async function getR2PresignedUrl(fileName, contentType, folder = 'uploads') {
  const ext = fileName.split('.').pop()
  const key = `${folder}/${uuidv4()}.${ext}`

  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
  })

  const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn: 3600 }) // 1 hour

  return {
    uploadUrl,
    fileUrl: `${PUBLIC_URL}/${key}`,
    key,
  }
}

/**
 * Delete a file from R2 by key
 */
export async function deleteFromR2(key) {
  const command = new DeleteObjectCommand({ Bucket: BUCKET, Key: key })
  return r2Client.send(command)
}
