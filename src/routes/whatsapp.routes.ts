import { Router } from 'express'
import { BaileysController } from '../controllers/whatsapp.controller'
import multer from 'multer'

const upload = multer()
const router = Router()

router.post('/login/qr', BaileysController.loginWithQR)
router.post('/login/pairing', BaileysController.loginWithPairingCode)
router.post('/send/text', BaileysController.sendText)
router.post('/send/image', upload.array('image'), BaileysController.sendImage)
router.post('/send/document', upload.array('document'), BaileysController.sendDocument)
router.post('/logout', BaileysController.logout)
router.get('/sessions', BaileysController.listSessions)
router.patch('/session/:sessionId', BaileysController.updateSession)

export default router