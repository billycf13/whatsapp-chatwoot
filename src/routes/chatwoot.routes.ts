import { Router } from 'express'
import { ChatwootController } from '../controllers/chatwoot.controller'

const router = Router()

router.get('/searchContact/:q', ChatwootController.searchContact)
router.post('/createMessageAgent', ChatwootController.createMessageAgent)
router.post('/createMessageClient', ChatwootController.createMessageClient)
router.post('/createConversation', ChatwootController.createConversation)
router.post('/createContact', ChatwootController.createContact)


export default router