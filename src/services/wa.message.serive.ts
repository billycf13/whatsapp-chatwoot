import { BaileysConnection } from './baileys.service'

export class MessageService{
    private connection: BaileysConnection

    constructor(connection: BaileysConnection){
        this.connection = connection
    }

    async sendText(jid: string, text: string) {
        if (!this.connection['sock']) throw new Error('Not Connected')
        return await this.connection['sock']!.sendMessage(jid, { text })
    }

    async sendImage(jid: string, buffer: Buffer, caption?: string) {
        if (!this.connection['sock']) throw new Error('Not Connected')
        return await this.connection['sock']!.sendMessage(jid, {
            image: buffer,
            caption
        })
    }

    async sendDocument(jid: string, buffer: Buffer, fileName: string, mimetype: string) {
        if (!this.connection['sock']) throw new Error('Not Connected')
        return await this.connection['sock']!.sendMessage(jid, {
            document: buffer,
            fileName,
            mimetype
        })

    }

    async sendVideo(jid: string, buffer: Buffer, caption?: string) {
        if (!this.connection['sock']) throw new Error('Not Connected')
        return await this.connection['sock']!.sendMessage(jid, {
            video: buffer,
            caption
        })
    }

    async sendAudio(jid: string, buffer: Buffer) {
        if (!this.connection['sock']) throw new Error('Not Connected')
        return await this.connection['sock']!.sendMessage(jid, {
            audio: buffer,
            mimetype: 'audio/ogg; codecs=opus'
        })
    }

    async readMessages(jid: string, messageKeys: { remoteJid: string, id: string, participant?: string }[]) {
        if (!this.connection['sock']) throw new Error('Not Connected')
        return await this.connection['sock']!.readMessages(messageKeys)
    }
}