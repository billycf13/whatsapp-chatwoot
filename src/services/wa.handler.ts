import { WAMessage, WAMessageUpdate, Contact, downloadMediaMessage } from '@whiskeysockets/baileys'
import { ChatwootAppApi } from './cw.appApi'
import { ChatwootClientApi } from './cw.clientApi'
import { Session } from '../models/session.model'

const chatwootAppApi = new ChatwootAppApi()
const chatwootClientApi = new ChatwootClientApi()

export class WhatsAppHandler {
    private static instance: WhatsAppHandler
    // Mapping untuk menyimpan relasi messageId WhatsApp dengan Chatwoot
    private messageMapping = new Map<string, { conversation_id: number, message_id: number, phone: string, lastStatus?: number }>()
    
    private constructor() {}
    
    public static getInstance(): WhatsAppHandler {
        if (!WhatsAppHandler.instance) {
            WhatsAppHandler.instance = new WhatsAppHandler()
        }
        return WhatsAppHandler.instance
    }

    public async handleMessageUpdate(updates: WAMessageUpdate[]) {
        for (const update of updates) {
            const messageId = update.key.id
            const status = update.update?.status
            
            console.log('Message Update:', {
                messageId: messageId,
                status: update.update,
            })
            
            if (status && messageId) {
                await this.updateChatwootMessageStatus(messageId, status)
            }
        }
    }
    
    private async updateChatwootMessageStatus(whatsappMessageId: string, status: number) {
        try {
            // Cari mapping pesan di cache
            const messageInfo = this.messageMapping.get(whatsappMessageId)
            
            if (!messageInfo) {
                console.log('Message mapping not found for:', whatsappMessageId)
                console.log('Available mappings:', Array.from(this.messageMapping.keys()))
                return
            }
            
            // Cek apakah status baru lebih tinggi dari status terakhir
            if (messageInfo.lastStatus && status <= messageInfo.lastStatus) {
                console.log(`Ignoring status downgrade: ${whatsappMessageId} from ${messageInfo.lastStatus} to ${status}`)
                return
            }
            
            // Mapping status WhatsApp ke Chatwoot
            let chatwootStatus: string
            switch (status) {
                case 1: // Pending
                    chatwootStatus = 'pending'
                    break
                case 2: // Sent/Delivered
                    chatwootStatus = 'Sending'
                    break
                case 3: // Received
                    chatwootStatus = 'Delivered'
                    break
                case 4: // Read
                    chatwootStatus = 'read'
                    break
                default:
                    console.log('Unknown status:', status)
                    return
            }
            
            console.log(`Updating message status in Chatwoot: ${whatsappMessageId} -> ${chatwootStatus} (from status ${messageInfo.lastStatus || 'none'} to ${status})`)
            
            // Update status terakhir di mapping
            messageInfo.lastStatus = status
            this.messageMapping.set(whatsappMessageId, messageInfo)
            
            // Update status di Chatwoot (jika API tersedia)
            try {
                await chatwootAppApi.updateMessageStatus(
                    messageInfo.conversation_id,
                    messageInfo.message_id,
                    chatwootStatus
                )
                console.log(`Message status updated successfully: ${chatwootStatus}`)
            } catch (apiError) {
                console.log('Message status update API not available, logging status only:', chatwootStatus)
            }
            
        } catch (error) {
            console.error('Error updating message status in Chatwoot:', error)
        }
    }
    
    // Method untuk menyimpan mapping ketika mengirim pesan dari Chatwoot ke WhatsApp
    public storeMessageMapping(whatsappMessageId: string, conversation_id: number, message_id: number, phone: string) {
        console.log(`Storing message mapping: ${whatsappMessageId} -> conv:${conversation_id}, msg:${message_id}, phone:${phone}`)
        this.messageMapping.set(whatsappMessageId, {
            conversation_id,
            message_id,
            phone,
            lastStatus: 1 // Set status awal sebagai pending
        })
        
        // Auto cleanup setelah 24 jam
        setTimeout(() => {
            this.messageMapping.delete(whatsappMessageId)
            console.log(`Cleaned up message mapping: ${whatsappMessageId}`)
        }, 24 * 60 * 60 * 1000)
    }
    
    // Method untuk debugging
    public getMappingCount(): number {
        return this.messageMapping.size
    }
    
    public getAllMappings(): string[] {
        return Array.from(this.messageMapping.keys())
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
                        messageContent = message.message.imageMessage.caption || ''
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
                        messageContent = message.message.documentMessage.caption || ''
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
                        messageContent = ''
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
                        messageContent = message.message.videoMessage.caption || ''
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
                        messageContent = ''
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