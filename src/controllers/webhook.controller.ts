import { Request, Response } from 'express'
import { Session } from '../models/session.model'

export class WebhookController {
    static async handleChatwootWebhook(req: Request, res: Response): Promise<void> {
        const event = req.body
        if (event.event === 'message_created') {
            console.log('-------------------------------------------------------------------------------------')
            console.log(event.content)
            console.log(event.message_type)
            console.log(event.sender)
            console.log('-------------------------------------------------------------------------------------')
        }
    }
}