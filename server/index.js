import 'express-async-errors'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import dotenv from 'dotenv'

// Routes
import authRoutes from './routes/auth.js'
import uploadRoutes from './routes/upload.js'
import usersRoutes from './routes/users.js'
import facultyRoutes from './routes/faculty.js'
import studentsRoutes from './routes/students.js'
import requestsRoutes from './routes/requests.js'
import resourcesRoutes from './routes/resources.js'
import societiesRoutes from './routes/societies.js'
import marketplaceRoutes from './routes/marketplace.js'
import lostFoundRoutes from './routes/lostFound.js'
import shopsRoutes from './routes/shops.js'
import notifyRoutes from './routes/notify.js'
import adminRoutes from './routes/admin.js'
import classroomsRoutes from './routes/classrooms.js'
import supportRoutes from './routes/support.js'
import workspaceRoutes from './routes/workspace.js'
import workspaceFacultyRoutes from './routes/workspace_faculty.js'
import settingsRoutes from './routes/settings.js'
import wifiRoutes from './routes/wifi.js'

// Middleware
import { errorHandler } from './middleware/errorHandler.js'
import { rateLimiter } from './middleware/rateLimiter.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Config & Parsing
app.use(helmet())
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}))
app.use(morgan('dev'))
app.use(express.json({ limit: '2mb' }))
app.use(express.urlencoded({ extended: true, limit: '2mb' }))
app.use(rateLimiter)

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'SnapLocate Campus OS API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  })
})

// API Routes
app.use('/api/auth',        authRoutes)
app.use('/api/upload',      uploadRoutes)
app.use('/api/users',       usersRoutes)
app.use('/api/faculty',     facultyRoutes)
app.use('/api/students',    studentsRoutes)
app.use('/api/requests',    requestsRoutes)
app.use('/api/resources',   resourcesRoutes)
app.use('/api/societies',   societiesRoutes)
app.use('/api/marketplace', marketplaceRoutes)
app.use('/api/lost-found',  lostFoundRoutes)
app.use('/api/shops',       shopsRoutes)
app.use('/api/notify',      notifyRoutes)
app.use('/api/admin',       adminRoutes)
app.use('/api/classrooms',  classroomsRoutes)
app.use('/api/support',     supportRoutes)
app.use('/api/workspace',   workspaceRoutes)
app.use('/api/faculty-workspace', workspaceFacultyRoutes)
app.use('/api/settings',    settingsRoutes)
app.use('/api/wifi',        wifiRoutes)

// Error Handlers
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.url} not found` })
})


app.use(errorHandler)

// Server Start
app.listen(PORT, () => {
  console.log(`\n🚀 SnapLocate API running on http://localhost:${PORT}`)
  console.log(`📋 Health check: http://localhost:${PORT}/health`)
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}\n`)
})

export default app
