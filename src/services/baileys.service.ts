import { makeWASocket, DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion, makeCacheableSignalKeyStore } from '@whiskeysockets/baileys'
import { Boom } from '@hapi/boom'
import path from 'path'
import fs from 'fs'
import { EventEmitter } from 'events'
import { WhatsAppHandler } from './wa.handler'
import { Session } from '../models/session.model'

export class BaileysConnection extends EventEmitter{
    private sock: ReturnType<typeof makeWASocket> | null = null
    private sessionId: string
    private sessionFolder: string
    private authFolder: string
    private usePairingCode?: boolean = false
    private phoneNumber?: string
    private reconnectAttempts: number = 0
    private maxReconnectAttempts: number = 10
    private handler: WhatsAppHandler
 
    constructor(sessionId: string, usePairingCode?:boolean, phoneNumber?:string) {
        super()
        this.sessionId = sessionId
        this.sessionFolder = path.join(__dirname, '../..', 'sessions')
        this.authFolder = path.join(this.sessionFolder, this.sessionId)
        this.usePairingCode = usePairingCode
        this.phoneNumber = phoneNumber
        this.handler = new WhatsAppHandler()
    }

    public async connect(): Promise<void> {
        await this.startConnection()
    }

    private async startConnection(): Promise<void> {
        try {
            const { state, saveCreds } = await useMultiFileAuthState(this.authFolder)
            const { version } = await fetchLatestBaileysVersion()

            this.sock = makeWASocket({
                version,
                auth: {
                    creds: state.creds,
                    keys: makeCacheableSignalKeyStore(state.keys)
                }
            })

            this.sock.ev.on('connection.update', async (update) => {
                if(update.qr) {
                    if(!this.usePairingCode) {
                        this.emit('qr', update.qr)
                    } else {
                        const code = await this.sock!.requestPairingCode(this.phoneNumber!)
                        this.emit('pairingCode', code)
                    }
                }

                if(update.connection === 'close') {
                    const shouldReconnect = (update.lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut

                    if(shouldReconnect) {
                        this.reconnectAttempts++
                        if (this.reconnectAttempts > this.maxReconnectAttempts) {
                            console.error('Max reconnect attempts reached. Stopping reconnect.')
                            return
                        }
                        const delay = Math.min(3000 * this.reconnectAttempts, 6000)
                        console.log(`connection close, reconnecting in ${delay/1000}s... (attempt ${this.reconnectAttempts}) `)
                        setTimeout(() => this.startConnection(), delay)
                    } else {
                        this.reconnectAttempts = 0
                        console.log('Logged out, connection will not be restored')
                        try {
                            fs.rmSync(this.authFolder, { recursive: true, force: true })
                            console.log(`Deleted session folder: ${this.authFolder}`)

                            await Session.deleteOne({ sessionId: this.sessionId})
                            console.log(`Deleted session from database: ${this.sessionId }`)
                        } catch (err) {
                            console.log(`Failed to delete session folder ${this.authFolder}`, err)
                            if (err instanceof Error) {
                                console.log(`Failed to delete session data ${err.message}`)
                            }
                        }
                    }
                } else if(update.connection === 'open') {
                    this.reconnectAttempts = 0
                    // Ambil nomor HP dari user.id
                    const userId = this.sock?.user?.id
                    const phoneNumber = userId ? userId.split(/[:@]/)[0] : ''
                    const name = this.sock?.user?.name || ''
                    await Session.findOneAndUpdate(
                        { sessionId: this.sessionId },
                        {
                            phoneNumber,
                            name
                        },
                        { upsert: true, new: true}
                    )
                    console.log('WhatsApp Connected:' + this.sock?.user?.id + ' - ' + this.sock?.user?.name)
                }
            })

            this.sock.ev.on('creds.update', saveCreds)
            
            this.sock.ev.on('messages.update', updates => {
                this.handler.handleMessageUpdate(updates)
            })
            this.sock.ev.on('messages.upsert', async (m) => {
                this.handler.handleMessageUpsert(m.messages, this.sessionId)
            })
            this.sock.ev.on('contacts.upsert', async (contacts) => {
                this.handler.handleContactUpsert(contacts)
            })

        } catch (error) {
            console.error('Connection failed:', error)
            setTimeout(() => this.startConnection(), 5000)
        }
    }


}
