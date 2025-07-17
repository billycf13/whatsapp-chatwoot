import { Router } from 'express'
import { CwConfigController } from '../controllers/cwConfig.controller'

const router = Router()

// CRUD operations
router.post('/', CwConfigController.createConfig)
router.get('/', CwConfigController.getAllConfigs)
router.get('/:id', CwConfigController.getConfigById)
router.put('/:id', CwConfigController.updateConfig)
router.delete('/:id', CwConfigController.deleteConfig)
 
// Session-specific operations
router.get('/session/:sessionId', CwConfigController.getConfigBySessionId)
router.put('/session/:sessionId', CwConfigController.updateConfigBySessionId)

export default router