import axios from 'axios'
import { ChatwootConfig } from '../models/cwConfig.model'

interface ChatwootAppConfig {
    baseUrl: string
    agentApiToken: string
    botApiToken: string
    accountId: string
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

export class ChatwootAppApi {
    private baseUrl: string
    private agentApiToken: string
    private botApiToken: string
    private accountId: string
    private initialized: boolean = false

    private constructor(config: ChatwootAppConfig) {
        this.baseUrl = config.baseUrl
        this.agentApiToken = config.agentApiToken
        this.botApiToken = config.botApiToken
        this.accountId = config.accountId
        this.initialized = true
    }

    static async fromSessionId(sessionId: string): Promise<ChatwootAppApi | ApiResponse> {
        try {
            const config = await ChatwootConfig.findOne({ sessionId })
            if (!config) {
                return {
                    success: false,
                    message: 'Konfigurasi Chatwoot belum diset untuk session ini. Silakan set konfigurasi terlebih dahulu.'
                }
            }

            if (!config.baseUrl || !config.agentApiToken || !config.botApiToken || !config.accountId) {
                return {
                    success: false,
                    message: 'Konfigurasi Chatwoot tidak lengkap. Pastikan semua field telah diisi (baseUrl, agentApiToken, botApiToken, accountId).'
                }
            }

            return new ChatwootAppApi({
                baseUrl: config.baseUrl,
                agentApiToken: config.agentApiToken,
                botApiToken: config.botApiToken,
                accountId: config.accountId
            })
        } catch (error) {
            console.error('Error initializing ChatwootAppApi:', error)
            return {
                success: false,
                message: 'Gagal menginisialisasi ChatwootAppApi. Periksa koneksi database.'
            }
        }
    }

    private ensureInitialized(): void {
        if (!this.initialized) {
            throw new Error('ChatwootAppApi not properly initialized. Use fromSessionId() method.')
        }
    }

    async searchContact(q: string) {
        this.ensureInitialized()
        const encodedQuery = encodeURIComponent(q)
        const url = `${this.baseUrl}/api/v1/accounts/${this.accountId}/contacts/search?sort=phone_number&q=${encodedQuery}`
        
        try {
            const response = await axios.get(url, {
                headers: {
                    'Content-Type': 'application/json',
                    'api_access_token': this.agentApiToken
                },
                timeout: 10000
            })
            return response.data
        } catch (error: any) {
            console.error('Error fetching contacts:', error.response?.data || error.message)
            throw error
        }
    }

    async createMessage(conversation_id: number, content: string, messageType: string = 'outgoing', source_id: string = '') {
        this.ensureInitialized()
        const url = `${this.baseUrl}/api/v1/accounts/${this.accountId}/conversations/${conversation_id}/messages`
        
        try {
            const response = await axios.post(url, {
                content,
                message_type: messageType,
                source_id
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'api_access_token': this.botApiToken
                },
                timeout: 10000
            })

            // console.log('Message created successfully:', response.data) 
            return response.data
        } catch (error: any) {
            console.error('Error creating message:', error.response?.data || error.message)
            throw error
        }
    }

    async getConversationId(contact_id: number) {
        this.ensureInitialized()
        const url = `${this.baseUrl}/api/v1/accounts/${this.accountId}/contacts/${contact_id}/conversations`
        
        try {
            const response = await axios.get(url, {
                headers: {
                    'Content-Type': 'application/json',
                    'api_access_token': this.agentApiToken
                },
                timeout: 10000
            })
            return response.data
        } catch (error: any) {
            console.error('Error getting conversation ID:', error.response?.data || error.message)
            throw error
        }
    }

    async showContact(contact_id: number) {
        this.ensureInitialized()
        const url = `${this.baseUrl}/api/v1/accounts/${this.accountId}/contacts/${contact_id}`
        
        try {
            const response = await axios.get(url, {
                headers: {
                    'Content-Type': 'application/json',
                    'api_access_token': this.agentApiToken
                },
                timeout: 10000
            })
            return response.data
        } catch (error: any) {
            console.error('Error showing contact:', error.response?.data || error.message)
            throw error
        }
    }

    async getContactConversation(contact_id: number) {
        this.ensureInitialized()
        const url = `${this.baseUrl}/api/v1/accounts/${this.accountId}/contacts/${contact_id}/conversations`
        
        try {
            const response = await axios.get(url, {
                headers: {
                    'Content-Type': 'application/json',
                    'api_access_token': this.agentApiToken
                },
                timeout: 10000
            })
            return response.data
        } catch (error: any) {
            console.error('Error getting contact conversation:', error.response?.data || error.message)
            throw error
        }
    }

    async createMessageWithAttachment(
        conversation_id: number,
        content: string,
        attachments: AttachmentData[] = [],
        source_id: string = '',
        message_type = 'outgoing'
    ) {
        this.ensureInitialized()
        const url = `${this.baseUrl}/api/v1/accounts/${this.accountId}/conversations/${conversation_id}/messages`
        
        try {
            const FormData = require('form-data')
            const formData = new FormData()
            
            formData.append('content', content)
            formData.append('message_type', message_type)
            
            for (const attachment of attachments) {
                if (!Buffer.isBuffer(attachment.buffer)) {
                    throw new Error('Invalid buffer for attachment')
                }
                
                formData.append('attachments[]', attachment.buffer, {
                    filename: attachment.filename,
                    contentType: attachment.mimetype,
                })
            }
            
            const response = await axios.post(url, formData, {
                headers: {
                    ...formData.getHeaders(),
                    'api_access_token': this.botApiToken,
                    'source_id': source_id
                },
                maxContentLength: Infinity,
                maxBodyLength: Infinity,
                timeout: 30000
            })
            
            // console.log('Message created successfully:', response.data) 
            return response.data
        } catch (error: any) {
            console.error('Error creating message with attachment via App API:', error.response?.data || error.message)
            throw error
        }
    }
    
    async updateMessageStatus(conversation_id: number, message_id: number, status: string) {
        this.ensureInitialized()
        const url = `${this.baseUrl}/api/v1/accounts/${this.accountId}/conversations/${conversation_id}/messages/${message_id}`
        
        try {
            const response = await axios.patch(url, {
                status: status
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'api_access_token': this.agentApiToken
                },
                timeout: 10000
            })
            
            // console.log('Message status updated successfully:', response.data)
            return response.data
        } catch (error: any) {
            console.error('Error updating message status:', {
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                message: error.message
            })
            throw error
        }
    }

    async getMessage(conversation_id: number) {
        this.ensureInitialized()
        const url = `${this.baseUrl}/api/v1/accounts/${this.accountId}/conversations/${conversation_id}/messages`
        
        try {
            const response = await axios.get(url, {
                headers: {
                    'Content-Type': 'application/json',
                    'api_access_token': this.agentApiToken
                },
                timeout: 10000
            })
            return response.data
        } catch (error: any) {
            console.error('Error getting message:', error.response?.data || error.message)
            throw error
        }
    }

    async getMessageBySourceId(conversation_id: number, source_id: string) {
        this.ensureInitialized()
        const url = `${this.baseUrl}/api/v1/accounts/${this.accountId}/conversations/${conversation_id}/messages`
        
        try {
            const response = await axios.get(url, {
                headers: {
                    'Content-Type': 'application/json',
                    'api_access_token': this.agentApiToken
                },
                timeout: 10000
            })
            
            // Filter pesan berdasarkan source_id
            const messages = response.data.payload
            const targetMessage = messages.find((msg: any) => msg.source_id === source_id)
            
            return targetMessage || null
        } catch (error: any) {
            console.error('Error getting message by source_id:', error.response?.data || error.message)
            throw error
        }
    }

    async getMessageById(conversation_id: number, message_id: number) {
        this.ensureInitialized()
        const url = `${this.baseUrl}/api/v1/accounts/${this.accountId}/conversations/${conversation_id}/messages/${message_id}`
        
        try {
            const response = await axios.get(url, {
                headers: {
                    'Content-Type': 'application/json',
                    'api_access_token': this.agentApiToken
                },
                timeout: 10000
            })
            const message = response.data.payload
            const targetedMessage = message.find((msg: any) => msg.id === message_id)
            return targetedMessage || null
        } catch (error: any) {
            console.error('Error getting message by id:', error.response?.data || error.message)
            throw error
        }
    }

    async createMessageReply(conversation_id: number, content: string, messageType: string = 'outgoing', source_id: string = '', in_reply_to: any = null) {
        this.ensureInitialized()
        const url = `${this.baseUrl}/api/v1/accounts/${this.accountId}/conversations/${conversation_id}/messages`
        
        try {
            const response = await axios.post(url, {
                content,
                message_type: messageType,
                source_id,
                content_attributes: {
                    in_reply_to
                }
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'api_access_token': this.botApiToken
                },
                timeout: 10000
            })

            // console.log('Message created successfully:', response.data) 
            return response.data
        } catch (error: any) {
            console.error('Error creating message:', error.response?.data || error.message)
            throw error
        }
    }

}