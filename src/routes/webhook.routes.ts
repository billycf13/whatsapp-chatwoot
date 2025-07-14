import { Router } from 'express'
import { WebhookController } from '../controllers/webhook.controller'

const router = Router()

router.post('/:sessionId', WebhookController.handleChatwootWebhook)

export default router