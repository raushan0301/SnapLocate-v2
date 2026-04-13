import { v2 as cloudinary } from 'cloudinary'
import dotenv from 'dotenv'
dotenv.config()

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
})

/**
 * Upload a file buffer/stream to Cloudinary
 * @param {Buffer|string} file - file buffer or file path
 * @param {object} options - cloudinary upload options
 * @returns {Promise<{url: string, public_id: string}>}
 */
export async function uploadToCloudinary(file, options = {}) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder || 'snaplocate',
        resource_type: options.resource_type || 'auto',
        transformation: options.transformation || [],
        ...options,
      },
      (error, result) => {
        if (error) {
          const msg = error.message || error.error?.message || JSON.stringify(error)
          return reject(new Error(`Cloudinary: ${msg}`))
        }
        resolve({
          url: result.secure_url,
          public_id: result.public_id,
          width: result.width,
          height: result.height,
          format: result.format,
          bytes: result.bytes,
        })
      }
    )
    if (Buffer.isBuffer(file)) {
      uploadStream.end(file)
    } else {
      reject(new Error('File must be a Buffer'))
    }
  })
}

/**
 * Delete a file from Cloudinary by public_id
 */
export async function deleteFromCloudinary(public_id) {
  return cloudinary.uploader.destroy(public_id)
}

export default cloudinary
