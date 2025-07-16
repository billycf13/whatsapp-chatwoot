import express from 'express'
import cors from 'cors'
import path from 'path'
import whatsappRouter from './routes/whatsapp.routes'
import webhookRouter from './routes/webhook.routes'
import cwConfigRouter from './routes/cwConfig.routes'   

const app = express()
app.use(express.json())

// Konfigurasi CORS yang lebih permisif untuk Chatwoot
app.use(cors())

app.use(express.static(path.join(__dirname,'public')))

app.use('/whatsapp', whatsappRouter)
app.use('/webhook/', webhookRouter)
app.use('/chatwoot-config', cwConfigRouter)

export default app