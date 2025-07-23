"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const cwConfig_controller_1 = require("../controllers/cwConfig.controller");
const router = (0, express_1.Router)();
// CRUD operations
router.post('/', cwConfig_controller_1.CwConfigController.createConfig);
router.get('/', cwConfig_controller_1.CwConfigController.getAllConfigs);
router.get('/:id', cwConfig_controller_1.CwConfigController.getConfigById);
router.put('/:id', cwConfig_controller_1.CwConfigController.updateConfig);
router.delete('/:id', cwConfig_controller_1.CwConfigController.deleteConfig);
// Session-specific operations
router.get('/session/:sessionId', cwConfig_controller_1.CwConfigController.getConfigBySessionId);
router.put('/session/:sessionId', cwConfig_controller_1.CwConfigController.updateConfigBySessionId);
exports.default = router;
