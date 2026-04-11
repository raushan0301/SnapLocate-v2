import { Router } from 'express'
import { z } from 'zod'
import { uploadToCloudinary } from '../lib/cloudinary.js'
import { getR2PresignedUrl } from '../lib/r2.js'
import { supabaseAdmin } from '../lib/supabase.js'
import { authenticate } from '../middleware/auth.js'
import { uploadImage, uploadPDF, uploadAny } from '../middleware/multer.js'

const router = Router()

const CLOUDINARY_FOLDERS = {
  avatar: 'snaplocate/avatars',
  society: 'snaplocate/societies',
  marketplace: 'snaplocate/marketplace',
  workspace: 'snaplocate/workspace',
  lost_found: 'snaplocate/lost-found',
  shop: 'snaplocate/shops',
}

// ─── POST /api/upload/image ──────────────────────────────────
// Uploads image to Cloudinary, returns URL
router.post('/image', authenticate, uploadImage.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' })
  }

  const folder_key = req.body.type || 'avatar'
  const folder = CLOUDINARY_FOLDERS[folder_key] || 'snaplocate/misc'

  const result = await uploadToCloudinary(req.file.buffer, {
    folder,
    transformation: [{ width: 1200, crop: 'limit', quality: 'auto' }],
  })

  res.json({
    success: true,
    url: result.url,
    public_id: result.public_id,
  })
})

// ─── POST /api/upload/workspace ────────────────────────────────
// Uploads ANY file (<10MB) to Cloudinary directly, returns URL
router.post('/workspace', authenticate, uploadAny.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' })

  const isImage = req.file.mimetype.startsWith('image/')
  const cleanName = req.file.originalname.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9.\-_]/g, '_')
  const publicId = `${Date.now()}_${cleanName}`

  const result = await uploadToCloudinary(req.file.buffer, {
    folder: 'snaplocate/workspace',
    public_id: publicId,
    resource_type: isImage ? 'image' : 'raw', // Force raw for PDFs/Docs
  })

  res.json({
    success: true,
    url: result.url,
    path: result.public_id,
  })
})

// ─── POST /api/upload/pdf ────────────────────────────────────
// Uploads small PDF (<5MB) to Supabase Storage, returns URL
router.post('/pdf', authenticate, uploadPDF.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' })
  }

  const folder = req.body.folder || 'snaplocate/documents'

  const result = await uploadToCloudinary(req.file.buffer, {
    folder,
    resource_type: 'auto',
  })

  res.json({
    success: true,
    url: result.url,
    path: result.public_id,
  })
})

// ─── POST /api/upload/presign ────────────────────────────────
// Generates a presigned R2 URL for large file (>5MB) direct upload from client
router.post('/presign', authenticate, async (req, res) => {
  const schema = z.object({
    fileName: z.string(),
    contentType: z.string(),
    folder: z.string().optional().default('resources'),
  })

  const { fileName, contentType, folder } = schema.parse(req.body)

  const result = await getR2PresignedUrl(fileName, contentType, folder)

  res.json({
    success: true,
    uploadUrl: result.uploadUrl,
    fileUrl: result.fileUrl,
    key: result.key,
    expiresIn: 3600,
  })
})

export default router
