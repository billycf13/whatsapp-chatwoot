"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const whatsapp_controller_1 = require("../controllers/whatsapp.controller");
const multer_1 = __importDefault(require("multer"));
const upload = (0, multer_1.default)();
const router = (0, express_1.Router)();
router.post('/login/qr', whatsapp_controller_1.WhatsappController.loginWithQR);
router.post('/login/pairing', whatsapp_controller_1.WhatsappController.loginWithPairingCode);
router.post('/send/text', whatsapp_controller_1.WhatsappController.sendText);
router.post('/send/image', upload.array('image'), whatsapp_controller_1.WhatsappController.sendImage);
router.post('/send/document', upload.array('document'), whatsapp_controller_1.WhatsappController.sendDocument);
router.post('/logout', whatsapp_controller_1.WhatsappController.logout);
router.get('/sessions', whatsapp_controller_1.WhatsappController.listSessions);
router.patch('/session/:sessionId', whatsapp_controller_1.WhatsappController.updateSession);
exports.default = router;
