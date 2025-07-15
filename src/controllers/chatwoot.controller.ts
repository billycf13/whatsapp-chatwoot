import { Request, Response } from 'express'
import { ChatwootAppApi } from '../services/cw.appApi'
import { ChatwootClientApi } from '../services/cw.clientApi'
import { Contact } from '../models/contact.model'

export class ChatwootController {
    private static chatwootAppApi = new ChatwootAppApi()
    private static chatwootClientApi = new ChatwootClientApi()

    static async searchContact(req: Request, res: Response) {
        try {
            const q = req.params.q // Menggunakan params karena di route menggunakan :q
            const contacts = await ChatwootController.chatwootAppApi.searchContact(q)
            res.json(contacts)
        } catch (error:any) {
            console.error('Error searching contact:', error)
            res.status(500).json({ error: error.message })
        }
    }

    static async createMessageAgent(req: Request, res: Response) {
        try {
            const conversationId = req.body.conversationId
            const content = req.body.content
            const messageType = req.body.messageType
            const message = await ChatwootController.chatwootAppApi.createMessage(conversationId, content, messageType)
            res.json(message)
        } catch (error:any) {
            console.error('Error creating message:', error)
            res.status(500).json({ error: error.message })
        }
    }

    static async createContact(req: Request, res: Response) {
        try {
            const contact = req.body.contact
            const inbox_identifier = req.body.inbox_identifier
            const createdContact = await ChatwootController.chatwootClientApi.createContact(inbox_identifier,{
                identifier: contact.identifier,
                name: contact.name,
                phone_number: contact.phone_number
            })
            // const createdContact = contact.name + ' '+ contact.identifier + ' ' + contact.phone_number + '' + inbox_identifier
            res.json(createdContact)
        } catch (error:any) {
            console.error('Error creating contact:', error)
            res.status(500).json({ error: error.message })
        }
    }

    static async createConversation(req: Request, res: Response) {
        try {
            const inbox_identifier = req.body.inbox_identifier
            const contact_identifier = req.body.contact_identifier //source_id
            const createdConversation = await ChatwootController.chatwootClientApi.createConversation(inbox_identifier,contact_identifier)
            res.json(createdConversation)
        } catch (error:any) {
            console.error('Error creating conversation:', error)
            res.status(500).json({ error: error.message })
        }
    }

    static async createMessageClient(req: Request, res: Response) {
        try {
            const inbox_identifier = req.body.inbox_identifier
            const contact_identifier = req.body.contact_identifier
            const conversation_id = req.body.conversation_id
            const content = req.body.content
            const createdMessage = await ChatwootController.chatwootClientApi.createMessage(inbox_identifier,contact_identifier, conversation_id,content)
            res.json(createdMessage)
        } catch (error:any) {
            console.error('Error creating message:', error)
            res.status(500).json({ error: error.message })
        }
    }
}