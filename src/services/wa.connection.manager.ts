import { BaileysConnection } from './baileys.service'

export class ConnectionManager {
    private static instance: Map<string, BaileysConnection> = new Map()

    static async getConnection(sessionId: string, usePairingCode?: boolean, phoneNumber?: string): Promise<BaileysConnection> {
        let conn = this.instance.get(sessionId)
        if (!conn) {
            conn = new BaileysConnection(sessionId, usePairingCode, phoneNumber)
            await conn.connect()
            this.instance.set(sessionId, conn)
        }
        return conn
    }
    static async logout(sessionId: string) {
        const conn = this.instance.get(sessionId)
        if (conn && conn['sock']) {
            await conn['sock'].logout()
            this.instance.delete(sessionId)
        }
    }
    static updateSessionId(oldSessionId: string, newSessionId: string, conn: BaileysConnection) {
        if (this.instance.has(oldSessionId)) {
            this.instance.delete(oldSessionId)
            this.instance.set(newSessionId, conn)
        }
    }
}
