import axios from 'axios'
import FormData from 'form-data'
import { ChatwootConfig } from '../models/cwConfig.model'

interface ContactData {
    identifier: string
    name: string
    phone_number: string
}

interface AttachmentData {
    buffer: Buffer
    filename: string
    mimetype: string
}

interface ApiResponse {
    success: boolean
    message: string
    data?: any
}

export class ChatwootClientApi {
    private baseUrl: string
    private initialized: boolean = false

    private constructor(baseUrl: string) {
        this.baseUrl = baseUrl
        this.initialized = true
    }

    static async fromSessionId(sessionId: string): Promise<ChatwootClientApi | ApiResponse> {
        try {
            const config = await ChatwootConfig.findOne({ sessionId })
            if (!config) {
                return {
                    success: false,
                    message: 'Konfigurasi Chatwoot belum diset untuk session ini. Silakan set konfigurasi terlebih dahulu.'
                }
            }

            if (!config.baseUrl) {
                return {
                    success: false,
                    message: 'Base URL Chatwoot belum diset. Silakan lengkapi konfigurasi.'
                }
            }

            return new ChatwootClientApi(config.baseUrl)
        } catch (error) {
            console.error('Error initializing ChatwootClientApi:', error)
            return {
                success: false,
                message: 'Gagal menginisialisasi ChatwootClientApi. Periksa koneksi database.'
            }
        }
    }

    private ensureInitialized(): void {
        if (!this.initialized) {
            throw new Error('ChatwootClientApi not properly initialized. Use fromSessionId() method.')
        }
    }

    async createContact(inboxIdentifier: string, contact: ContactData) {
        this.ensureInitialized()
        
        try {
            const response = await axios.post(
                `${this.baseUrl}/public/api/v1/inboxes/${encodeURIComponent(inboxIdentifier)}/contacts`,
                contact,
                {
                    headers: { 'Content-Type': 'application/json' },
                    timeout: 10000
                }
            )
            return response.data
        } catch (error: any) {
            console.error('Error creating contact in Chatwoot:', error.response?.data || error.message)
            throw error
        }
    }

    async createConversation(inbox_identifier: string, contact_identifier: string) {
        this.ensureInitialized()
        const url = `${this.baseUrl}/public/api/v1/inboxes/${encodeURIComponent(inbox_identifier)}/contacts/${encodeURIComponent(contact_identifier)}/conversations`
        
        try {
            const response = await axios.post(url, {}, {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            })
            return response.data
        } catch (error: any) {
            console.error('Error creating conversation in Chatwoot:', error.response?.data || error.message)
            throw error
        }
    }

    async createMessage(inbox_identifier: string, contact_identifier: string, conversation_id: number, content: string) {
        this.ensureInitialized()
        const url = `${this.baseUrl}/public/api/v1/inboxes/${encodeURIComponent(inbox_identifier)}/contacts/${encodeURIComponent(contact_identifier)}/conversations/${conversation_id}/messages`
        
        try {
            const response = await axios.post(url, {
                content
            }, {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            })
            return response.data
        } catch (error: any) {
            console.error('Error creating message in Chatwoot:', error.response?.data || error.message)
            throw error
        }
    }

    async createMessageWithAttachment(
        inbox_identifier: string,
        contact_identifier: string,
        conversation_id: number,
        content: string,
        attachments: AttachmentData[] = []
    ) {
        this.ensureInitialized()
        
        if (attachments.length === 0) {
            return this.createMessage(inbox_identifier, contact_identifier, conversation_id, content)
        }

        const url = `${this.baseUrl}/public/api/v1/inboxes/${encodeURIComponent(inbox_identifier)}/contacts/${encodeURIComponent(contact_identifier)}/conversations/${conversation_id}/messages`
        
        try {
            const results = []
            
            for (const attachment of attachments) {
                const formData = new FormData()
                formData.append('content', content)
                
                if (!Buffer.isBuffer(attachment.buffer)) {
                    throw new Error('Invalid buffer for attachment')
                }
                
                formData.append('attachments[]', attachment.buffer, {
                    filename: attachment.filename,
                    contentType: attachment.mimetype,
                    knownLength: attachment.buffer.length
                })
                
                const response = await axios.post(url, formData, {
                    headers: formData.getHeaders(),
                    maxContentLength: Infinity,
                    maxBodyLength: Infinity,
                    timeout: 30000
                })
                
                results.push(response.data)
            }
            
            return results[0]
        } catch (error: any) {
            console.error('Error creating message with attachment:', error.response?.data || error.message)
            
            // Fallback: kirim sebagai text saja
            try {
                return await this.createMessage(
                    inbox_identifier, 
                    contact_identifier, 
                    conversation_id, 
                    `${content}\n\n[File attachment gagal dikirim: ${attachments[0]?.filename}]`
                )
            } catch (fallbackError) {
                console.error('Fallback message creation also failed:', fallbackError)
                throw error // Throw original error
            }
        }
    }
}