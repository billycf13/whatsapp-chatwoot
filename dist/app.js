"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const whatsapp_routes_1 = __importDefault(require("./routes/whatsapp.routes"));
const webhook_routes_1 = __importDefault(require("./routes/webhook.routes"));
const cwConfig_routes_1 = __importDefault(require("./routes/cwConfig.routes"));
const app = (0, express_1.default)();
app.use(express_1.default.json());
// Konfigurasi CORS yang lebih permisif untuk Chatwoot
app.use((0, cors_1.default)());
app.use(express_1.default.static(path_1.default.join(__dirname, 'public')));
app.use('/whatsapp', whatsapp_routes_1.default);
app.use('/webhook/', webhook_routes_1.default);
app.use('/chatwoot-config', cwConfig_routes_1.default);
exports.default = app;
