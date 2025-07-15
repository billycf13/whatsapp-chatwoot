import { WAMessage, WAMessageUpdate, Contact, downloadMediaMessage } from '@whiskeysockets/baileys'
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
                    
                    // Proses berbagai jenis pesan PERTAMA
                    let messageContent = ''
                    let attachments: any[] = []
                    
                    if (message.message?.conversation) {
                        messageContent = message.message.conversation
                    } else if (message.message?.imageMessage) {
                        messageContent = message.message.imageMessage.caption || '[Gambar]'
                        try {
                            const imageBuffer = await downloadMediaMessage(message, 'buffer', {})
                            attachments.push({
                                type: 'image',
                                buffer: imageBuffer,
                                mimetype: message.message.imageMessage.mimetype,
                                filename: `image_${Date.now()}.jpg`
                            })
                        } catch (error) {
                            console.error('Error downloading image:', error)
                            messageContent = '[Gambar - Gagal diunduh]'
                        }
                    } else if (message.message?.documentMessage) {
                        messageContent = message.message.documentMessage.caption || '[Dokumen]'
                        try {
                            const docBuffer = await downloadMediaMessage(message, 'buffer', {})
                            attachments.push({
                                type: 'document',
                                buffer: docBuffer,
                                mimetype: message.message.documentMessage.mimetype,
                                filename: message.message.documentMessage.fileName || `document_${Date.now()}`
                            })
                        } catch (error) {
                            console.error('Error downloading document:', error)
                            messageContent = '[Dokumen - Gagal diunduh]'
                        }
                    } else if (message.message?.audioMessage) {
                        messageContent = '[Audio]'
                        try {
                            const audioBuffer = await downloadMediaMessage(message, 'buffer', {})
                            attachments.push({
                                type: 'audio',
                                buffer: audioBuffer,
                                mimetype: message.message.audioMessage.mimetype,
                                filename: `audio_${Date.now()}.ogg`
                            })
                        } catch (error) {
                            console.error('Error downloading audio:', error)
                            messageContent = '[Audio - Gagal diunduh]'
                        }
                    } else if (message.message?.videoMessage) {
                        messageContent = message.message.videoMessage.caption || '[Video]'
                        try {
                            const videoBuffer = await downloadMediaMessage(message, 'buffer', {})
                            attachments.push({
                                type: 'video',
                                buffer: videoBuffer,
                                mimetype: message.message.videoMessage.mimetype,
                                filename: `video_${Date.now()}.mp4`
                            })
                        } catch (error) {
                            console.error('Error downloading video:', error)
                            messageContent = '[Video - Gagal diunduh]'
                        }
                    } else if (message.message?.stickerMessage) {
                        messageContent = '[Stiker]'
                        try {
                            const stickerBuffer = await downloadMediaMessage(message, 'buffer', {})
                            attachments.push({
                                type: 'sticker',
                                buffer: stickerBuffer,
                                mimetype: 'image/webp',
                                filename: `sticker_${Date.now()}.webp`
                            })
                        } catch (error) {
                            console.error('Error downloading sticker:', error)
                            messageContent = '[Stiker - Gagal diunduh]'
                        }
                    } else {
                        messageContent = '[Pesan tidak didukung]'
                    }

                    // Cari kontak SETELAH memproses pesan
                    const contact = await chatwootAppApi.searchContact(phone)
                    
                    let contact_identifier: string
                    let conversation_id: number
                    
                    if (contact.payload.length === 0) {
                        // Buat kontak baru
                        const identifier = message.key.remoteJid 
                        const phone_number = '+' + message.key.remoteJid?.split('@')[0]!
                        const name = message.pushName || phone_number
                        const createContact = await chatwootClientApi.createContact(inbox_identifier, {
                            identifier: identifier || '',
                            name: name,
                            phone_number: phone_number
                        })
                        contact_identifier = createContact.source_id
                        
                        // Buat percakapan
                        const createConversation = await chatwootClientApi.createConversation(inbox_identifier, contact_identifier)
                        conversation_id = createConversation.id
                    } else {
                        // Gunakan kontak yang ada
                        contact_identifier = contact.payload[0].contact_inboxes[0].source_id
                        const contact_id = contact.payload[0].id
                        
                        // Cari conversation
                        const getConversation = await chatwootAppApi.getConversationId(contact_id)
                        conversation_id = getConversation.payload[0].id
                    }
                    
                    // Kirim pesan ke Chatwoot
                    await this.sendMessageToChatwoot(
                        inbox_identifier, 
                        contact_identifier, 
                        conversation_id, 
                        messageContent, 
                        attachments
                    )
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

    private async sendMessageToChatwoot(
        inbox_identifier: string,
        contact_identifier: string,
        conversation_id: number,
        content: string,
        attachments: any[] = []
    ) {
        try {
            if (attachments.length > 0) {
                return await chatwootClientApi.createMessageWithAttachment(
                    inbox_identifier,
                    contact_identifier,
                    conversation_id,
                    content,
                    attachments
                )
            } else {
                return await chatwootClientApi.createMessage(
                    inbox_identifier,
                    contact_identifier,
                    conversation_id,
                    content
                )
            }
        } catch (error) {
            console.error('Error sending message to chatwoot:', error)
            throw error
        }
    }
}