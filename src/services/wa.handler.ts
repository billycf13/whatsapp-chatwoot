import { WAMessage, WAMessageUpdate, Contact } from '@whiskeysockets/baileys'

export class WhatsAppHandler {
    constructor() {}

    public handleMessageUpdate(updates: WAMessageUpdate[]) {
        for (const update of updates) {
            console.log('Message Update:', {
                messageId: update.key.id,
                status: update.update,
            })
            // Implementasi logika untuk update status pesan
        }
    }

    public handleMessageUpsert(messages: WAMessage[]) {
        for (const message of messages) {
            const date = new Date(Number(message.messageTimestamp) * 1000)
            const formattedTime = date.toLocaleDateString('id-ID', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            })
            console.log('New Message:', {
                messageId: message.key.id,
                from_jid: message.key.remoteJid,
                fromMe: message.key.fromMe,
                phone: message.key.remoteJid?.split('@')[0],
                name: message.pushName,
                message: message.message?.conversation,
                timestamp: formattedTime,
                // upsert: message,
            })
            // Implementasi logika untuk pesan baru
        }
    }

    public handleContactUpsert(contacts: Contact[]) {
        for (const contact of contacts) {
            console.log('Contact Update:', {
                id: contact.id,
                name: contact.name || contact.notify,
                contact: contact
            })
            // Implementasi logika untuk update kontak
        }
    }
}