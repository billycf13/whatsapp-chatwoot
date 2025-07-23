import { Router } from 'express'
import { WhatsappController } from '../controllers/whatsapp.controller'
import multer from 'multer'

const upload = multer()
const router = Router()

router.post('/login/qr', WhatsappController.loginWithQR)
router.post('/login/pairing', WhatsappController.loginWithPairingCode)
router.post('/send/text', WhatsappController.sendText)
router.post('/send/image', upload.array('image'), WhatsappController.sendImage)
router.post('/send/document', upload.array('document'), WhatsappController.sendDocument)
router.post('/logout', WhatsappController.logout)
router.get('/sessions', WhatsappController.listSessions)
router.patch('/session/:sessionId', WhatsappController.updateSession)
// Tambahkan route baru untuk mengatur presence
router.post('/presence', WhatsappController.updatePresence)

export default router