import { Request, Response } from 'express'
import { Session } from '../models/session.model'
import { ChatwootAppApi } from '../services/cw.appApi'
import { MessageService } from '../services/wa.message.serive'
import { ConnectionManager } from '../services/wa.connection.manager'
import { WhatsappController } from '../controllers/whatsapp.controller'
// const conn = ConnectionManager.getConnection('5659b861-db0f-4743-a3d5-9c7bfb35b470')

const chatwootAppApi = new ChatwootAppApi()
// let messageService: MessageService;
const whatsappController = new WhatsappController()
// conn!.then(connection => {
//     messageService = new MessageService(connection);
// });

export class WebhookController {
    static async handleChatwootWebhook(req: Request, res: Response): Promise<void> {
        const sessionId = req.params.sessionId
        const event = req.body
        if (event.event === 'message_created' && event.sender.type === 'user' && event.message_type === 'outgoing') {
            const contact_id = Number(event.conversation.contact_inbox.contact_id)
            const showContact = await chatwootAppApi.showContact(contact_id)
            const identifier = showContact.payload.identifier
            const jid = identifier
            const message = event.content
            const contentType = event.content_type
            if (contentType === 'text') {
                console.log(sessionId, jid, message)
                const sendText = await whatsappController.sendMessage(sessionId, jid, message)
                console.log(sendText)
            } else {
                console.log(contentType)
            }
            // const sendText = await messageService.sendText(identifier + '@s.whatsapp.net', 'Halo, selamat datang di Chatwoot')
            // console.log(sendText)
        } else if (event.event ==='message_updated') {
            console.log(event)
        }
        res.send('Webhook received!')
    }
}