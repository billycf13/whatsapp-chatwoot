import express from 'express'
import cors from 'cors'
import path from 'path'
import whatsappRouter from './routes/whatsapp.routes'
import chatwootRouter from './routes/chatwoot.routes'
import webhookRouter from './routes/webhook.routes'

const app = express()
app.use(express.json())
app.use(cors())
app.use(express.static(path.join(__dirname,'public')))

app.use('/whatsapp', whatsappRouter)
app.use('/chatwoot', chatwootRouter)
app.use('/webhook/', webhookRouter)

export default app