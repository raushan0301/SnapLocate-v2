import multer from 'multer'

// Store files in memory (as Buffer) so we can pipe to Cloudinary/R2
const storage = multer.memoryStorage()

const fileFilter = (allowedMimes) => (req, file, cb) => {
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    const err = new Error(`Invalid file type. Allowed: ${allowedMimes.join(', ')}`)
    err.status = 400
    cb(err, false)
  }
}

export const uploadImage = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB 
  fileFilter: fileFilter(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']),
})

export const uploadPDF = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: fileFilter(['application/pdf']),
})

export const uploadAny = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit for server-proxy
  fileFilter: fileFilter([
    'image/jpeg', 'image/png', 'image/webp', 'application/pdf', 
    'application/zip', 'text/plain', 'application/msword', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]),
})
