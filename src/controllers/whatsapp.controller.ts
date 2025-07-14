import { Request, Response } from 'express'
import { ConnectionManager } from '../services/wa.connection.manager'
import { MessageService } from '../services/wa.message.serive'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'
import fs from 'fs'
import { Session } from '../models/session.model'

export class BaileysController {
    static async loginWithQR(req: Request, res: Response): Promise<any> {
        const sessionId = uuidv4()
        const conn = await ConnectionManager.getConnection(sessionId)
    

        conn.once('qr', (qr: string) => {
            res.json({ qr })
        })

        conn.once('error', (err: any) => {
            res.status(500).json({ error: err.message || 'Failed to connect'})
        })
    }
    static async loginWithPairingCode(req: Request, res: Response): Promise<any> {
        const sessionId = uuidv4()
        const { phoneNumber } = req.body
        if (!phoneNumber) {
            return res.status(400).json({ error: 'phoneNumber is required' })
        }

        const conn = await ConnectionManager.getConnection(sessionId, true, phoneNumber)

        conn.once('pairingCode', (code: string) => {
            res.json({ pairingCode: code})
        })

        conn.once('error', (err: any) => {
            res.status(500).json({ error: err.message || 'Failed to connect'})
        })
    }

    static async logout(req: Request, res: Response): Promise<any> {
        const { sessionId } = req.body
        if (!sessionId) {
            return res.status(400).json({ error: 'sessionId is required'})
        }

        try {
            await ConnectionManager.logout(sessionId)
            const sessionFolder = path.join(__dirname, '../..', 'sessions', sessionId)
            if (fs.existsSync(sessionFolder)) {
                fs.rmSync(sessionFolder, { recursive: true, force: true })
                res.json({ success: true, message: 'Logged out and session deleted' })
            } else {
                res.status(404).json({ error: 'Session not found' })
            }
        } catch (err: any) {
            res.status(500).json({ error: err.message })
        }
    }

    static async listSessions(_req: Request, res: Response): Promise<any> {
        try {
            const sessions = await Session.find()

            const activeSessionIds = sessions.filter(session => {
                const sessionPath = path.join(__dirname, '../..', 'sessions', session.sessionId)
                return fs.existsSync(sessionPath) && fs.existsSync(path.join(sessionPath, 'creds.json'))
            })

            const activeSessions = await Promise.all(
                activeSessionIds.map(async (session) => {
                    const connection = await ConnectionManager.getConnection(session.sessionId)
                    const sock = connection['sock']
                    return {
                        sessionId: session.sessionId,
                        phoneNumber: session.phoneNumber,
                        name: session.name,
                        inbox_identifier: session.inbox_identifier,
                        user: sock?.user
                    }
                })
            )

            res.json({ sessions: activeSessions})
        } catch (error: any) {
            res.status(500).json({ error: error.message })
        }
    }
    static async updateSession(req: Request, res: Response): Promise<void> {
        try {
            const { sessionId } = req.params
            const { inbox_identifier } = req.body

            const session = await Session.findOneAndUpdate(
                { sessionId },
                {
                    inbox_identifier
                },
                { new: true}
            )
    
            if (!session) {
                res.status(404).json({ error: 'Session not found'})
                return
            }
    
            res.json(session)
        }
        catch (error: any) {
            res.status(500).json({ error: error.message })
        }
    }

    static async sendText(req: Request, res: Response): Promise<any> {
        const { sessionId, jid, text } = req.body
        if (!jid || !text) {
            return res.status(400).json({ error: 'jid and text required'})
        }

        const conn = await ConnectionManager.getConnection(sessionId)
        const msgService = new MessageService(conn)

        try {
            const result = await msgService.sendText(jid, text)
            res.json({ result })
        } catch (err: any) {
            res.status(500).json({ error: err.message })
        }
    }

    static async sendImage(req: Request, res: Response): Promise<any> {
        const { sessionId, jid, caption } = req.body
        const files = req.files as Express.Multer.File[]
        if (!jid || !req.files || files.length === 0) {
            return res.status(400).json({ error: 'jid and image file are required' })
        }
        const conn = await ConnectionManager.getConnection(sessionId)
        const msgService = new MessageService(conn)
        try {
            const results = []
            for (const file of files) {
                const result = await msgService.sendImage(jid, file.buffer, caption)
                results.push(result)
            }
            res.json({ results })
        } catch (err: any) {
            res.status(500).json({ error: err.message })
        }
    }

    static async sendDocument(req: Request, res: Response): Promise<any> {
        const { sessionId, jid, fileName, mimetype } = req.body
        const files = req.files as Express.Multer.File[]
        if (!jid || !req.files || files.length === 0) {
            return res.status(400).json({ error: 'jid, file, fileName and mimetype are required' })
        }
        const conn = await ConnectionManager.getConnection(sessionId)
        const msgService = new MessageService(conn)

        try {
            const results = []
            for (const file of files) {
                const result = await msgService.sendDocument(jid, file.buffer, fileName, mimetype)
                results.push(result)
            }
            res.json({ results })
        } catch (err: any) {
            res.status(500).json({ error: err.message})
        }
    } 
}