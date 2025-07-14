import axios from 'axios'
import dotenv from 'dotenv'

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

    async craeteConversation(inbox_identifier: string, contact_identifier: string) {
        const url = `${this.baseUrl}/public/api/v1/inboxes/${inbox_identifier}/contacts/${contact_identifier}/conversations`
        try {
            const response = await axios.post(url, {
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            return response.data
        } catch (error) {
            console.log('Error craeting conversation in Chatwoot: ',error)
        }
    }

    async createMessage(inbox_identifier: string, contact_identifier: string, conversation_id: number, content: string) {
        const url = `${this.baseUrl}/public/api/v1/inboxes/${inbox_identifier}/contacts/${contact_identifier}/conversations/${conversation_id}/messages`
        try {
            const response = await axios.post(url, {
                content,
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            return response.data
        } catch (error) {
            console.log('Error craeting message in Chatwoot: ',error)
        }
    }
}