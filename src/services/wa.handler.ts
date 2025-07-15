import { WAMessage, WAMessageUpdate, Contact } from '@whiskeysockets/baileys'
import { ChatwootAppApi } from './cw.appApi'
import { ChatwootClientApi } from './cw.clientApi'
import { Session } from '../models/session.model'

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

    public async handleMessageUpsert(messages: WAMessage[], sessionId: string) {
        const getInboxIdentifier = await Session.findOne({ sessionId })
        if (getInboxIdentifier?.inbox_identifier !== '') {
            const inbox_identifier = getInboxIdentifier?.inbox_identifier!
            for (const message of messages) {
                if (!message.key.fromMe) {
                    const phone = message.key.remoteJid?.split('@')[0]!
                    // cari kontak
                    const contact = await chatwootAppApi.searchContact(phone)
                    // jika tidak ada kontak, buat kontak
                    if (contact.payload.length === 0) {
                        const identifier = message.key.remoteJid 
                        const phone_number = '+' + message.key.remoteJid?.split('@')[0]!
                        const name = message.pushName || phone_number
                        const createContact = await chatwootClientApi.createContact(inbox_identifier, {
                            identifier: identifier || '',
                            name: name,
                            phone_number: phone_number
                        })
                        const contact_identifier = createContact.source_id
                        // buat percakapan
                        if (contact_identifier) {
                            const createConversation = await chatwootClientApi.createConversation(inbox_identifier, contact_identifier)
                            // cek percakan yang dibuat
                            if (createConversation) {
                                const phone_number = createConversation.contact.phone_number
                                const getSource_id = await chatwootAppApi.searchContact(phone_number)
                                const source_id = getSource_id.payload[0].contact_inboxes[0].source_id
                                // send message
                                const messageContent = message.message?.conversation
                                const creteMessage = await chatwootClientApi.createMessage(inbox_identifier, source_id, createConversation.id, messageContent?? '')
                                console.log(creteMessage)
                            }
                        }
                    } else {
                        // buat percakapan
                        const contact_identifier = contact.payload[0].contact_inboxes[0].source_id
                        const contact_id = contact.payload[0].id
                        // cari conversation
                        const getConversation = await chatwootAppApi.getConversationId(contact_id)
                        if (getConversation) {
                            const conversation_id = getConversation.payload[0].id
                            // send message
                            const messageContent = message.message?.conversation
                            const creteMessage = await chatwootClientApi.createMessage(inbox_identifier, contact_identifier, conversation_id, messageContent?? '')
                            console.log(creteMessage)
                        }
                    }
                }
            }
        }
    }

    public handleContactUpsert(contacts: Contact[]) {
        for (const contact of contacts) {
            console.log('Contact Update:', {
                id: contact.id,
                name: contact.name || contact.notify,
                contact: contact
            })
        }
    }
}