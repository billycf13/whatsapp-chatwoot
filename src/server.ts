import app from './app'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import path from 'path'
import fs from 'fs'
import { ConnectionManager } from './services/wa.connection.manager'
import WebSocket from 'ws'

dotenv.config()

const port = process.env.PORT || ''
const wssport:number = process.env.WSSPORT ? parseInt(process.env.WSSPORT) : 3081
const mongodbUrl = process.env.MONGODB_URI || ''
const sessionDir = process.env.SESSION_DIR || ''
const wss = new WebSocket.Server({ port: wssport })
const wsClients: Record<string, any> = {}

if (!mongodbUrl) {
  console.error('MONGODB_URI is not defined in the environment variables.')
  process.exit(1)
}

// MONGODB-CONFIGURATION
mongoose.connect(mongodbUrl)
  .then(() => {
    console.log('Connected to MongoDB')
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error)
  })

//WHATSAPP AUTO CONNECT
async function autoConnectAllSessions() {
    if (!fs.existsSync(sessionDir)) return

    const sessionIds = fs.readdirSync(sessionDir).filter(name => {
        const sessionPath = path.join(sessionDir, name)
        return fs.statSync(sessionPath).isDirectory()
    })

    for (const sessionId of sessionIds) {
        const sessionPath = path.join(sessionDir, sessionId)
        const credsPath = path.join(sessionPath, 'creds.json')
        const files = fs.readdirSync(sessionPath)
        if (files.length === 0 || (files.length === 1 && files[0] === 'creds.json')) {
            fs.rmSync(sessionPath, { recursive: true, force: true })
            console.log(`Incomplete session ${sessionId} deleted`)
            continue
        }
        if (!fs.existsSync(credsPath)) {
            fs.rmSync(sessionPath, { recursive: true, force: true })
            console.log(`Incomplete session ${sessionId} without creds deleted`)
            continue
        }

        try {
            console.log(`Auto connecting session ${sessionId}`)
            await ConnectionManager.getConnection(sessionId)
            console.log(`Auto connected session ${sessionId}`)
        } catch (error) {
            console.error(`Error auto connecting session ${sessionId}:`, error)
            fs.rmSync(sessionPath, { recursive: true, force: true })
            console.log(`Incomplete session ${sessionId} deleted`)
        }
    }
}

autoConnectAllSessions()

//WEBSOCKET
wss.on('connection', (ws, req) => {
    ws.on('message', (msg) => {
        try {
            const { sessionId } = JSON.parse(msg.toString())
            wsClients[sessionId] = ws
            ws.send(JSON.stringify({ status: 'connected' }))
        } catch {}
    })
    ws.on('close', () => {
        Object.keys(wsClients).forEach(sessionId => {
            if (wsClients[sessionId] === ws) {
                delete wsClients[sessionId]
            }
        })
    })  
})

app.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})

export { wsClients }