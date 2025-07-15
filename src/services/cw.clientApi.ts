import axios from 'axios'
import dotenv from 'dotenv'
import FormData from 'form-data'

dotenv.config()

export class ChatwootClientApi {
    private baseUrl : string

    constructor () {
        this.baseUrl = process.env.CHATWOOT_BASE_URL!
    }

    async createContact(inboxIdentifier: string, contact: {
        identifier: string,
        name: string,
        phone_number: string
    }) {
        try {
            const response = await axios.post(
                `${this.baseUrl}/public/api/v1/inboxes/${inboxIdentifier}/contacts`,
                contact,
                 {
                headers: {'Content-Type': 'application/json'}
                }
            )
            return response.data
        } catch (error) {
            console.error('Error creating contact in Chatwoot: ', error)
            throw error
        }
    }

    async createConversation(inbox_identifier: string, contact_identifier: string) {
        const url = `${this.baseUrl}/public/api/v1/inboxes/${inbox_identifier}/contacts/${contact_identifier}/conversations`
        try {
            const response = await axios.post(url, {
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            return response.data
        } catch (error) {
            console.log('Error creating conversation in Chatwoot: ',error)
            throw error
        }
    }

    async createMessage(inbox_identifier: string, contact_identifier: string, conversation_id: number, content: string) {
        const url = `${this.baseUrl}/public/api/v1/inboxes/${inbox_identifier}/contacts/${contact_identifier}/conversations/${conversation_id}/messages`
        try {
            const response = await axios.post(url, {
                content
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            return response.data
        } catch (error) {
            console.log('Error creating message in Chatwoot: ',error)
            throw error
        }
    }

    async createMessageWithAttachment(
        inbox_identifier: string,
        contact_identifier: string,
        conversation_id: number,
        content: string,
        attachments: any[] = []
    ) {
        const url = `${this.baseUrl}/public/api/v1/inboxes/${inbox_identifier}/contacts/${contact_identifier}/conversations/${conversation_id}/messages`
        
        if (attachments.length === 0) {
            return this.createMessage(inbox_identifier, contact_identifier, conversation_id, content)
        }

        try {
            // Coba kirim satu file per request
            const results = []
            
            for (const attachment of attachments) {
                const formData = new FormData()
                formData.append('content', content)
                
                // Pastikan buffer valid
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
            
            return results[0] // Return first result
        } catch (error: any) {
            console.log('Error creating message with attachment:', error.response?.data || error.message)
            
            // Fallback: kirim sebagai text saja
            return this.createMessage(inbox_identifier, contact_identifier, conversation_id, 
                `${content}\n\n[File attachment gagal dikirim: ${attachments[0]?.filename}]`)
        }
    }
}