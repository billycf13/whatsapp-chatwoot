import { WAMessage, WAMessageUpdate, Contact, downloadMediaMessage } from '@whiskeysockets/baileys'
import { ChatwootAppApi } from './cw.appApi'
import { ChatwootClientApi } from './cw.clientApi'
import { ChatwootConfig } from '../models/cwConfig.model'
import { MessageMapping } from '../models/messageMapping.model'

import { 
    processWhatsAppMedia, 
    getWhatsAppMediaInfo, 
    getWhatsAppMediaCaption,
    hasWhatsAppMedia 
} from '../utils'

export class WhatsAppHandler {
    private static instance: WhatsAppHandler
    private chatwootAppApi: ChatwootAppApi | null = null
    private chatwootClientApi: ChatwootClientApi | null = null
    private sessionId: string
    private configInitialized: boolean = false
    private sock: any = null
    private messageMapping = new Map<string, { conversation_id: number, message_id: number, phone: string, lastStatus?: number, contactid: string, inbox_id: string }>()
    // Tambahkan properti incomingMessages yang hilang
    private incomingMessages = new Map<string, { messageId: string, jid: string, conversationId: number }>()
    
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

    public setSocket(sock: any) {
        this.sock = sock
    }

    public async handleMessageUpdate(updates: WAMessageUpdate[]) {
        if (!this.checkConfigInitialized()) return
        
        for (const update of updates) {
            const messageId = update.key.id
            const status = update.update?.status
            // console.log(update)
            
            if (status && messageId) {
                await this.updateChatwootMessageStatus(messageId, status)
            }
        }
    }
    
    private async updateChatwootMessageStatus(whatsappMessageId: string, status: number) {
        if (!this.checkConfigInitialized()) return
        
        try {
            const messageInfo = this.messageMapping.get(whatsappMessageId)
            
            if (!messageInfo) {
                // console.log('Message mapping not found for:', whatsappMessageId)
                return
            }
            
            if (messageInfo.lastStatus && status <= messageInfo.lastStatus) {
                // console.log(`Ignoring status downgrade: ${whatsappMessageId} from ${messageInfo.lastStatus} to ${status}`)
                return
            }
            
            let chatwootStatus: string
            switch (status) {
                case 1:
                    chatwootStatus = 'pending'
                    break
                case 2:
                    chatwootStatus = 'Sending'
                    break
                case 3:
                    chatwootStatus = 'Delivered'
                    break
                case 4:
                    chatwootStatus = 'read'
                    break
                default:
                    console.log('Unknown status:', status)
                    return
            }
            
            // console.log(`Updating message status in Chatwoot: ${whatsappMessageId} -> ${chatwootStatus} (from status ${messageInfo.lastStatus || 'none'} to ${status})`)
            
            messageInfo.lastStatus = status
            this.messageMapping.set(whatsappMessageId, messageInfo)
            
            try {
                await this.chatwootAppApi!.updateMessageStatus(
                    messageInfo.conversation_id,
                    messageInfo.message_id,
                    chatwootStatus
                )
                // console.log(`Message status updated successfully: ${chatwootStatus}`)
            } catch (apiError) {
                console.error('Message status update API not available, logging status only:', chatwootStatus)
            }
            
        } catch (error) {
            console.error('Error updating message status in Chatwoot:', error)
        }
    }
    
    public storeMessageMapping(whatsappMessageId: string, conversation_id: number, message_id: number, phone: string, contactid: string = '', inbox_id: string = '') {
        // console.log(`Storing message mapping: ${whatsappMessageId} -> conv:${conversation_id}, msg:${message_id}, phone:${phone}`)
        this.messageMapping.set(whatsappMessageId, {
            conversation_id,
            message_id,
            phone,
            lastStatus: 1,
            contactid,
            inbox_id
        })
        
        setTimeout(() => {
            this.messageMapping.delete(whatsappMessageId)
            console.log(`Cleaned up message mapping: ${whatsappMessageId}`)
        }, 24 * 60 * 60 * 1000)
    }
    
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
                if (!message.key.fromMe && 
                    !message.key.remoteJid?.endsWith('@g.us') && 
                    !message.key.remoteJid?.includes('status@broadcast')) {
                    
                    await this.processIncomingMessage(message, inbox_identifier)
                    
                } else if (message.key.fromMe) {
                    await this.processOutgoingMessage(message)
                }
            }
        }
    }

    private async processIncomingMessage(message: WAMessage, inbox_identifier: string) {
        const jid = message.key.remoteJid!
        const phone = jid.split('@')[0]
        const messageId = message.key.id!

        const { messageContent, attachments } = await this.processMessageContent(message)
        
        // Skip jika tidak ada konten (seperti protocol messages)
        if (!messageContent && attachments.length === 0) {
            console.log('Skipping message with no content (likely system message)')
            return
        }
        
        const { contact_identifier, conversation_id } = await this.handleContactAndConversation(
            message, phone, inbox_identifier
        )
        
        // Simpan pesan masuk untuk tracking read status
        this.incomingMessages.set(messageId, {
            messageId,
            jid,
            conversationId: conversation_id
        })
        
        // Auto-cleanup setelah 24 jam
        setTimeout(() => {
            this.incomingMessages.delete(messageId)
        }, 24 * 60 * 60 * 1000)
        
        if (message.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
            console.log('ini id pesan yang di quote:', message.message.extendedTextMessage.contextInfo.stanzaId)
            
            // Cari kontak
            const getContact = await this.chatwootAppApi!.searchContact(phone!)
            if (getContact.payload.length === 0) {
                console.log('Contact not found')
                return
            }
            
            const contact_id = getContact.payload[0].id
            // Cari percakapan
            const getConversation = await this.chatwootAppApi!.getConversationId(contact_id)
            if (!getConversation.payload || getConversation.payload.length === 0) {
                console.log('Conversation not found')
                return
            }
            const conversation_id = getConversation.payload[0].id
            const messageReply = message.message.extendedTextMessage.text
            const stanzaId = message.message.extendedTextMessage.contextInfo.stanzaId!

            const getMessage = await this.chatwootAppApi!.getMessageBySourceId(
                conversation_id,
                stanzaId
            )
            if (getMessage) {
                await this.chatwootAppApi!.createMessageReply(
                    conversation_id,
                    messageReply || '',
                    'incoming',
                    getMessage.source_id,
                    getMessage.id
                )
            }
    
        } else {
            const send = await this.sendMessageToChatwoot(
                inbox_identifier, 
                contact_identifier, 
                conversation_id, 
                messageContent, 
                attachments,
                messageId
            )
            if (send) {
                console.log('chatwoot message id ' + send.id + ' whatsapp message id ' + send.source_id + ' contact id ' + send.inbox_id + ' conversation id '+ send.conversation_id)
            }
        }
    }
    
    // Method untuk menandai conversation sebagai dibaca di WhatsApp
    public async markConversationAsRead(conversationId: number) {
        if (!this.sock) {
            console.log('WhatsApp socket not available')
            return
        }
        
        try {
            const messagesToRead: { remoteJid: string, id: string }[] = []
            
            // Cari semua pesan masuk untuk conversation ini
            for (const [messageId, messageInfo] of this.incomingMessages.entries()) {
                if (messageInfo.conversationId === conversationId) {
                    messagesToRead.push({
                        remoteJid: messageInfo.jid,
                        id: messageInfo.messageId
                    })
                }
            }
            
            if (messagesToRead.length > 0) {
                // Gunakan Baileys readMessages untuk menandai sebagai dibaca
                await this.sock.readMessages(messagesToRead)
                // console.log(`✅ Marked ${messagesToRead.length} WhatsApp messages as read for conversation ${conversationId}`)
                
                // Hapus dari tracking setelah dibaca
                messagesToRead.forEach(msg => {
                    this.incomingMessages.delete(msg.id)
                })
            } 
        } catch (error) {
            console.error('❌ Error marking conversation as read:', error)
        }
    }

    private async processOutgoingMessage(message: WAMessage) {
        const msgId = message.key.id
        const msgInfo = this.messageMapping.get(msgId!)
        
        console.log('Outgoing WhatsApp message Id: ' + msgId + 'Chatwoot message Id: ' + msgInfo?.message_id + 'conversation Id: ' + msgInfo?.conversation_id + ' contactid: ' + msgInfo?.contactid + ' inbox_id '+msgInfo?.inbox_id)
        
        if (!msgInfo) {
            const phone = message.key.remoteJid?.split('@')[0]
            
            const { messageContent, attachments } = await this.processMessageContent(message)
            
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
    
            let createMessage
            if (attachments.length > 0) {
                createMessage = await this.chatwootAppApi!.createMessageWithAttachment(
                    conversation_id,
                    messageContent,
                    attachments,
                    msgId!
                )
                console.log('createMessage with attachment:', createMessage)
            } else {
                createMessage = await this.chatwootAppApi!.createMessage(
                    conversation_id,
                    messageContent,
                    'outgoing',
                    msgId!
                )
            }
    
            if (createMessage) {
                this.storeMessageMapping(msgId!, conversation_id, createMessage.id, phone!)
                await this.updateChatwootMessageStatus(msgId!, 4)
            }
        }
    }
    
    private async processMessageContent(message: WAMessage): Promise<{ messageContent: string, attachments: any[] }> {
        let messageContent = ''
        let attachments: any[] = []
        
        // Tangani pesan teks biasa
        if (message.message?.conversation) {
            messageContent = message.message.conversation
            return { messageContent, attachments }
        }
        
        // Tangani extended text message (pesan teks dengan format atau context)
        if (message.message?.extendedTextMessage?.text) {
            messageContent = message.message.extendedTextMessage.text
            return { messageContent, attachments }
        }
        
        // Skip protocol messages (sistem messages seperti ephemeral settings)
        if (message.message?.protocolMessage) {
            console.log('Skipping protocol message (system message)')
            return { messageContent: '', attachments: [] }
        }
        
        // Tangani media messages
        if (hasWhatsAppMedia(message.message)) {
            try {
                console.log('Processing WhatsApp media...', {
                    messageType: Object.keys(message.message || {}),
                    hasMedia: hasWhatsAppMedia(message.message),
                    hasSocket: !!this.sock
                })
                
                const processedAttachment = await processWhatsAppMedia(message, this.sock)
                
                if (processedAttachment) {
                    console.log('Media processed successfully:', {
                        filename: processedAttachment.filename,
                        mimetype: processedAttachment.mimetype,
                        bufferSize: processedAttachment.buffer?.length,
                        category: processedAttachment.category
                    })
                    
                    attachments.push({
                        buffer: processedAttachment.buffer,
                        mimetype: processedAttachment.mimetype,
                        filename: processedAttachment.filename
                    })
                } else {
                    console.log('No processed attachment returned')
                }
                
                messageContent = getWhatsAppMediaCaption(message.message) || ''
                
            } catch (error) {
                console.error('Error processing media:', error)
                const mediaInfo = getWhatsAppMediaInfo(message.message)
                messageContent = `[${this.getMediaErrorMessage(mediaInfo.mediaType)} - Gagal diunduh]`
            }
        } else {
            messageContent = '[Pesan tidak didukung]'
        }
        
        console.log('Final message content:', {
            messageContent,
            attachmentCount: attachments.length
        })
        
        return { messageContent, attachments }
    }

    private async handleContactAndConversation(
        message: WAMessage, 
        phone: string, 
        inbox_identifier: string
    ): Promise<{ contact_identifier: string, conversation_id: number }> {
        const contact = await this.chatwootAppApi!.searchContact(phone)
        
        let contact_identifier: string
        let conversation_id: number
        
        if (contact.payload.length === 0) {
            const identifier = message.key.remoteJid 
            const phone_number = '+' + message.key.remoteJid?.split('@')[0]!
            const name = message.pushName || phone_number
            const createContact = await this.chatwootClientApi!.createContact(inbox_identifier, {
                identifier: identifier || '',
                name: name,
                phone_number: phone_number
            })
            // contact_identifier = createContact.source_id
            if (createContact) {
                console.log('contact created successfully')
            }
            const searchContact = await this.chatwootAppApi!.searchContact(phone)
            console.log('search contact',searchContact.payload)
            contact_identifier =searchContact.payload[0].contact_inboxes[0].source_id
            console.log('contact identifier: ', contact_identifier)
            console.log('innbox identifier: ', inbox_identifier)
            const createConversation = await this.chatwootClientApi!.createConversation(inbox_identifier, contact_identifier)
            conversation_id = createConversation.id
            console.log('create conversation: ',createConversation)
        } else {
            contact_identifier = contact.payload[0].contact_inboxes[0].source_id
            const contact_id = contact.payload[0].id
            
            let getConversation = await this.chatwootAppApi!.getConversationId(contact_id)
            
            if (!getConversation.payload || getConversation.payload.length === 0) {
                const newConversation = await this.chatwootClientApi!.createConversation(inbox_identifier, contact_id)
                conversation_id = newConversation.id
            } else {
                conversation_id = getConversation.payload[0].id
            }
        }
        
        return { contact_identifier, conversation_id }
    }

    private getMediaErrorMessage(mediaType?: string): string {
        switch (mediaType) {
            case 'image': return 'Gambar'
            case 'video': return 'Video'
            case 'audio': return 'Audio'
            case 'document': return 'Dokumen'
            case 'sticker': return 'Stiker'
            default: return 'Media'
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
        attachments: any[] = [],
        source_id: string = ''
    ) {
        if (!this.checkConfigInitialized()) return
        
        try {
            if (attachments.length > 0) {
                console.log('Sending message with attachments:', {
                    attachmentCount: attachments.length,
                    attachmentInfo: attachments.map(att => ({
                        filename: att.filename,
                        mimetype: att.mimetype,
                        bufferSize: att.buffer?.length
                    }))
                })
                
                const send = await this.chatwootAppApi!.createMessageWithAttachment(
                    conversation_id,
                    content,
                    attachments,
                    source_id
                )
                return send
            } else {
                const send = await this.chatwootAppApi!.createMessage(
                    conversation_id,
                    content,
                    'incoming',
                    source_id
                )
                return send
            }
            // console.log('Message sent successfully to Chatwoot')
        } catch (error) {
            console.error('Error sending message to Chatwoot:', error)
        }
    }
    
    public async reinitializeApis() {
        this.configInitialized = false
        this.chatwootAppApi = null
        this.chatwootClientApi = null
        await this.initializeApis()
    }
}