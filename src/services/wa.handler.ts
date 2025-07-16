import { WAMessage, WAMessageUpdate, Contact, downloadMediaMessage } from '@whiskeysockets/baileys'
import { ChatwootAppApi } from './cw.appApi'
import { ChatwootClientApi } from './cw.clientApi'
import { ChatwootConfig } from '../models/cwConfig.model'

export class WhatsAppHandler {
    private static instance: WhatsAppHandler
    private chatwootAppApi: ChatwootAppApi | null = null
    private chatwootClientApi: ChatwootClientApi | null = null
    private sessionId: string
    private configInitialized: boolean = false
    // Mapping untuk menyimpan relasi messageId WhatsApp dengan Chatwoot
    private messageMapping = new Map<string, { conversation_id: number, message_id: number, phone: string, lastStatus?: number }>()
    
    private constructor(sessionId: string) {
        this.sessionId = sessionId
        this.initializeApis()
    }
    
    private async initializeApis() {
        try {
            const appApiResult = await ChatwootAppApi.fromSessionId(this.sessionId)
            const clientApiResult = await ChatwootClientApi.fromSessionId(this.sessionId)
            
            if ('success' in appApiResult && !appApiResult.success) {
                console.log('ChatwootAppApi:', appApiResult.message)
                return
            }
            
            if ('success' in clientApiResult && !clientApiResult.success) {
                console.log('ChatwootClientApi:', clientApiResult.message)
                return
            }
            
            this.chatwootAppApi = appApiResult as ChatwootAppApi
            this.chatwootClientApi = clientApiResult as ChatwootClientApi
            this.configInitialized = true
            console.log('Chatwoot APIs initialized successfully')
        } catch (error) {
            console.error('Error initializing Chatwoot APIs:', error)
        }
    }
    
    public static getInstance(sessionId: string): WhatsAppHandler {
        if (!WhatsAppHandler.instance) {
            WhatsAppHandler.instance = new WhatsAppHandler(sessionId)
        }
        return WhatsAppHandler.instance
    }
    
    private checkConfigInitialized(): boolean {
        if (!this.configInitialized || !this.chatwootAppApi || !this.chatwootClientApi) {
            console.log('Konfigurasi Chatwoot belum diset atau belum diinisialisasi')
            return false
        }
        return true
    }

    public async handleMessageUpdate(updates: WAMessageUpdate[]) {
        if (!this.checkConfigInitialized()) return
        
        for (const update of updates) {
            const messageId = update.key.id
            const status = update.update?.status
            console.log(update)
            
            if (status && messageId) {
                await this.updateChatwootMessageStatus(messageId, status)
            }
        }
    }
    
    private async updateChatwootMessageStatus(whatsappMessageId: string, status: number) {
        if (!this.checkConfigInitialized()) return
        
        try {
            // Cari mapping pesan di cache
            const messageInfo = this.messageMapping.get(whatsappMessageId)
            
            if (!messageInfo) {
                console.log('Message mapping not found for:', whatsappMessageId)
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
                await this.chatwootAppApi!.updateMessageStatus(
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

    public async handleMessageUpsert(messages: WAMessage[]) {
        if (!this.checkConfigInitialized()) return
        
        const sessionId = this.sessionId
        const getInboxIdentifier = await ChatwootConfig.findOne({ sessionId })
        if (getInboxIdentifier?.inboxIdentifier !== '') {
            const inbox_identifier = getInboxIdentifier?.inboxIdentifier!
            for (const message of messages) {
                // Skip jika pesan dari grup atau status broadcast
                if (!message.key.fromMe && 
                    !message.key.remoteJid?.endsWith('@g.us') && 
                    !message.key.remoteJid?.includes('status@broadcast')) {
                    const jid = message.key.remoteJid!
                    // Format nomor telepon dengan benar
                    const phone = jid.split('@')[0]
                    
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
                    const contact = await this.chatwootAppApi!.searchContact(phone)
                    
                    let contact_identifier: string
                    let conversation_id: number
                    
                    if (contact.payload.length === 0) {
                        // Buat kontak baru
                        const identifier = message.key.remoteJid 
                        const phone_number = '+' + message.key.remoteJid?.split('@')[0]!
                        const name = message.pushName || phone_number
                        const createContact = await this.chatwootClientApi!.createContact(inbox_identifier, {
                            identifier: identifier || '',
                            name: name,
                            phone_number: phone_number
                        })
                        contact_identifier = createContact.source_id
                        
                        // Buat percakapan
                        const createConversation = await this.chatwootClientApi!.createConversation(inbox_identifier, contact_identifier)
                        conversation_id = createConversation.id
                    } else {
                        // Gunakan kontak yang ada
                        contact_identifier = contact.payload[0].contact_inboxes[0].source_id
                        const contact_id = contact.payload[0].id
                        
                        // Cari conversation
                        let getConversation = await this.chatwootAppApi!.getConversationId(contact_id)
                        
                        // Jika conversation belum ada, buat baru
                        if (!getConversation.payload || getConversation.payload.length === 0) {
                            // Buat conversation baru
                            const newConversation = await this.chatwootClientApi!.createConversation(inbox_identifier, contact_id)
                            conversation_id = newConversation.id
                        } else {
                            conversation_id = getConversation.payload[0].id
                        }
                    }
                    
                    // Kirim pesan ke Chatwoot
                    await this.sendMessageToChatwoot(
                        inbox_identifier, 
                        contact_identifier, 
                        conversation_id, 
                        messageContent, 
                        attachments
                    )
                } else if (message.key.fromMe) {
                    const msgId = message.key.id
                    const msgInfo = this.messageMapping.get(msgId!)
                    if (!msgInfo) {
                        const phone = message.key.remoteJid?.split('@')[0]
                        let messageContent = ''
                        let attachments: any[] = []

                        // Proses berbagai jenis pesan
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

                        // Cari kontak dan conversation
                        const getContact = await this.chatwootAppApi!.searchContact(phone!)
                        if (getContact.payload.length === 0) {
                            console.log('Contact not found')
                            return
                        }
                        const contact_id = getContact.payload[0].id
                        const getConversation = await this.chatwootAppApi!.getConversationId(contact_id)
                        if (!getConversation.payload || getConversation.payload.length === 0) {
                            console.log('Conversation not found')
                            return
                        }
                        const conversation_id = getConversation.payload[0].id

                        // Kirim pesan ke Chatwoot
                        let createMessage
                        if (attachments.length > 0) {
                            createMessage = await this.chatwootAppApi!.createMessageWithAttachment(
                                conversation_id,
                                messageContent,
                                attachments
                            )
                        } else {
                            createMessage = await this.chatwootAppApi!.createMessage(
                                conversation_id,
                                messageContent,
                                'outgoing'
                            )
                        }

                        // Simpan mapping dan set status read
                        if (createMessage) {
                            this.storeMessageMapping(msgId!, conversation_id, createMessage.id, phone!)
                            await this.updateChatwootMessageStatus(msgId!, 4) // Set status read
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

    private async sendMessageToChatwoot(
        inbox_identifier: string,
        contact_identifier: string,
        conversation_id: number,
        content: string,
        attachments: any[] = []
    ) {
        if (!this.checkConfigInitialized()) return
        
        try {
            if (attachments.length > 0) {
                await this.chatwootClientApi!.createMessageWithAttachment(
                    inbox_identifier,
                    contact_identifier,
                    conversation_id,
                    content,
                    attachments
                )
            } else {
                await this.chatwootClientApi!.createMessage(
                    inbox_identifier,
                    contact_identifier,
                    conversation_id,
                    content
                )
            }
        } catch (error) {
            console.error('Error sending message to Chatwoot:', error)
        }
    }
    
    // Method untuk re-initialize APIs jika konfigurasi berubah
    public async reinitializeApis() {
        this.configInitialized = false
        this.chatwootAppApi = null
        this.chatwootClientApi = null
        await this.initializeApis()
    }
}