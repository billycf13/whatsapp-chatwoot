"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const webhook_controller_1 = require("../controllers/webhook.controller");
const router = (0, express_1.Router)();
router.post('/:sessionId', webhook_controller_1.WebhookController.handleChatwootWebhook);
exports.default = router;
