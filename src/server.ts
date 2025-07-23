import app from './app'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import path from 'path'
import fs from 'fs'
import { ConnectionManager } from './services/wa.connection.manager'
import WebSocket from 'ws'
import { MessageService } from './services/wa.message.serive'
import { Session } from './models/session.model'
import cron from 'node-cron'

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

/**
 * Fungsi untuk mengatur status presence untuk semua sesi
 * @param presence Status presence ('available' atau 'unavailable')
 */
async function updatePresenceForAllSessions(presence: 'available' | 'unavailable') {
    try {
        const sessions = await Session.find()
        
        for (const session of sessions) {
            try {
                const conn = await ConnectionManager.getConnection(session.sessionId)
                const msgService = new MessageService(conn)
                await msgService.sendPresenceUpdate(presence)
                console.log(`Updated presence to ${presence} for session ${session.sessionId}`)
            } catch (error) {
                console.error(`Error updating presence for session ${session.sessionId}:`, error)
            }
        }
    } catch (error) {
        console.error('Error fetching sessions:', error)
    }
}

/**
 * Fungsi untuk memeriksa apakah hari ini adalah hari Minggu
 * @returns Boolean yang menunjukkan apakah hari ini adalah hari Minggu
 */
function isSunday() {
    return new Date().getDay() === 0; // 0 adalah hari Minggu dalam JavaScript
}

// Jadwalkan status online pada jam 08:00 WIB (kecuali hari Minggu)
cron.schedule('0 8 * * *', async () => {
    // Jika hari ini Minggu, jangan ubah status menjadi online
    if (isSunday()) {
        console.log('Today is Sunday, keeping status offline')
        return
    }
    
    console.log('Setting status to online (available) - scheduled at 08:00 WIB')
    await updatePresenceForAllSessions('available')
}, {
    timezone: 'Asia/Jakarta'
})

// Jadwalkan status offline pada jam 16:00 WIB
cron.schedule('0 16 * * *', async () => {
    console.log('Setting status to offline (unavailable) - scheduled at 16:00 WIB')
    await updatePresenceForAllSessions('unavailable')
}, {
    timezone: 'Asia/Jakarta'
})

// Jadwalkan status offline pada awal hari Minggu (00:00 WIB)
cron.schedule('0 0 * * 0', async () => {
    console.log('Setting status to offline (unavailable) - Sunday 00:00 WIB')
    await updatePresenceForAllSessions('unavailable')
}, {
    timezone: 'Asia/Jakarta'
});

// Tambahkan pengecekan saat startup aplikasi untuk mengatur status sesuai dengan waktu saat ini
(async () => {
    // Tunggu koneksi database dan inisialisasi aplikasi
    await new Promise(resolve => setTimeout(resolve, 5000))
    
    const now = new Date()
    const currentHour = now.getHours()
    const isSundayToday = isSunday()
    
    // Jika hari ini Minggu atau di luar jam kerja (sebelum 8 pagi atau setelah 4 sore), set status offline
    if (isSundayToday || currentHour < 8 || currentHour >= 16) {
        console.log('Setting initial status to offline (unavailable)')
        await updatePresenceForAllSessions('unavailable')
    } else {
        console.log('Setting initial status to online (available)')
        await updatePresenceForAllSessions('available')
    }
})();