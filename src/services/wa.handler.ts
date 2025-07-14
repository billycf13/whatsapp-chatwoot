import { WAMessage, WAMessageUpdate, Contact } from '@whiskeysockets/baileys'
import { ChatwootAppApi } from './cw.appApi'
import { ChatwootClientApi } from './cw.clientApi'

const chatwootAppApi = new ChatwootAppApi()
const chatwootClientApi = new ChatwootClientApi()
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

    public async handleMessageUpsert(messages: WAMessage[]) {
        for (const message of messages) {
            const date = new Date(Number(message.messageTimestamp) * 1000)
            const formattedTime = date.toLocaleDateString('id-ID', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            })
            // console.log('New Message:', {
            //     messageId: message.key.id,
            //     from_jid: message.key.remoteJid,
            //     fromMe: message.key.fromMe,
            //     phone: message.key.remoteJid?.split('@')[0],
            //     name: message.pushName,
            //     message: message.message?.conversation,
            //     timestamp: formattedTime,
            //     // upsert: message,
            // })
            if (!message.key.fromMe) {
                const phone = message.key.remoteJid?.split('@')[0]!
                const contact = await chatwootAppApi.searchContact(phone)
                if(contact.payload[0].contact_inboxes.length > 0) {
                    const contact_id = contact.payload[0].id
                    const source_id = contact.payload[0].contact_inboxes[0].source_id
                    const getConversationId = await chatwootAppApi.getConversationId(contact_id)
                    const conversation_id = getConversationId.payload[0].id
                    const messageContent = message.message?.conversation
                    const creteMessage = chatwootClientApi.createMessage('CB4SeePzHiuYsdBroA2r4MDW', source_id, conversation_id, messageContent ?? '')
                    console.log(creteMessage)
                }
            }

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