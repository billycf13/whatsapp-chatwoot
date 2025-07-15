import express from 'express'
import cors from 'cors'
import path from 'path'
import whatsappRouter from './routes/whatsapp.routes'
import chatwootRouter from './routes/chatwoot.routes'
import webhookRouter from './routes/webhook.routes'

const app = express()
app.use(express.json())

// Konfigurasi CORS yang lebih permisif untuk Chatwoot
app.use(cors({
    origin: [
        'http://172.21.242.201:3000',  // Chatwoot URL dari .env
        'http://localhost:3000',
        'http://localhost:3080'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'api_access_token']
}))

app.use(express.static(path.join(__dirname,'public')))

// Static serving untuk uploads dengan header yang tepat
app.use('/uploads', express.static(path.join(__dirname, '../uploads'), {
    setHeaders: (res, path) => {
        // Set proper headers untuk file media
        if (path.endsWith('.jpg') || path.endsWith('.jpeg')) {
            res.setHeader('Content-Type', 'image/jpeg')
        } else if (path.endsWith('.png')) {
            res.setHeader('Content-Type', 'image/png')
        } else if (path.endsWith('.webp')) {
            res.setHeader('Content-Type', 'image/webp')
        }
        res.setHeader('Cache-Control', 'public, max-age=31536000')
    }
}))

app.use('/whatsapp', whatsappRouter)
app.use('/chatwoot', chatwootRouter)
app.use('/webhook/', webhookRouter)

export default app