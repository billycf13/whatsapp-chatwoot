import dotenv from 'dotenv'
import axios from 'axios'

dotenv.config()

export class ChatwootAppApi {
    private baseUrl : string
    private apiKey : string
    private accountId: string

    constructor () {
        this.baseUrl = process.env.CHATWOOT_BASE_URL!
        this.apiKey = process.env.CHATWOOT_API_KEY!
        this.accountId = process.env.CHATWOOT_ACCOUNT_ID!
    }

    async searchContact(q: string) {
        const url = `${this.baseUrl}/api/v1/accounts/${this.accountId}/contacts/search?sort=phone_number&q=${q}`
        try {
            const response = await axios.get(url, 
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'api_access_token': this.apiKey
                    }    
                }
            )
            return response.data
        } catch (error) {
            console.error('Error fetching contacts:', error)
            throw error
        }
    }

    async createMessage(conversation_id: number, content: string, messageType: string) {
        const url = `${this.baseUrl}/api/v1/accounts/${this.accountId}/conversations/${conversation_id}/messages`
        const response = await axios.post(url, 
            {
                content,
                message_type: messageType
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'api_access_token': this.apiKey
                }
            }
        )
        return response.data
    }

    async getConversationId(contact_id: number) {
        const url = `${this.baseUrl}/api/v1/accounts/${this.accountId}/contacts/${contact_id}/conversations`
        const response = await axios.get(url, 
            {
                headers: {
                    'Content-Type': 'application/json',
                    'api_access_token': this.apiKey
                }
            }
        )
        return response.data
    }

    async showContact(contact_id: number) {
        const url = `${this.baseUrl}/api/v1/accounts/${this.accountId}/contacts/${contact_id}`
        const response = await axios.get(url, 
            {
                headers: {
                    'Content-Type': 'application/json',
                    'api_access_token': this.apiKey
                }
            }
        )
        return response.data
    }

    async getContactConversation(contact_id: number) {
        const url = `${this.baseUrl}/api/v1/accounts/${this.accountId}/contacts/${contact_id}/conversations`
        const response = await axios.get(url,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'api_access_token': this.apiKey
                }
            }
        )
        return response.data
    }

    async createMessageWithAttachment(
        conversation_id: number,
        content: string,
        attachments: any[] = []
    ) {
        const url = `${this.baseUrl}/api/v1/accounts/${this.accountId}/conversations/${conversation_id}/messages`
        
        try {
            const FormData = require('form-data')
            const formData = new FormData()
            
            formData.append('content', content)
            formData.append('message_type', 'incoming')
            
            for (const attachment of attachments) {
                formData.append('attachments[]', attachment.buffer, {
                    filename: attachment.filename,
                    contentType: attachment.mimetype
                })
            }
            
            const response = await axios.post(url, formData, {
                headers: {
                    ...formData.getHeaders(),
                    'api_access_token': this.apiKey
                },
                maxContentLength: Infinity,
                maxBodyLength: Infinity,
                timeout: 30000
            })
            
            return response.data
        } catch (error: any) {
            console.error('Error creating message with attachment via App API:', error.response?.data || error.message)
            throw error
        }
    }
    
    async updateMessageStatus(conversation_id: number, message_id: number, status: string) {
        const url = `${this.baseUrl}/api/v1/accounts/${this.accountId}/conversations/${conversation_id}/messages/${message_id}`
        console.log(`Attempting to update message status: ${url}`, { status })
        
        try {
            const response = await axios.patch(url, 
                {
                    status: status
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'api_access_token': this.apiKey
                    }
                }
            )
            console.log('Chatwoot API response:', response.status, response.data)
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
}