"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsappController = void 0;
const wa_connection_manager_1 = require("../services/wa.connection.manager");
const wa_message_serive_1 = require("../services/wa.message.serive");
const uuid_1 = require("uuid");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const session_model_1 = require("../models/session.model");
class WhatsappController {
    static loginWithQR(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const sessionId = (0, uuid_1.v4)();
            const conn = yield wa_connection_manager_1.ConnectionManager.getConnection(sessionId);
            conn.once('qr', (qr) => {
                res.json({ qr });
            });
            conn.once('error', (err) => {
                res.status(500).json({ error: err.message || 'Failed to connect' });
            });
        });
    }
    static loginWithPairingCode(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const sessionId = (0, uuid_1.v4)();
            const { phoneNumber } = req.body;
            if (!phoneNumber) {
                return res.status(400).json({ error: 'phoneNumber is required' });
            }
            const conn = yield wa_connection_manager_1.ConnectionManager.getConnection(sessionId, true, phoneNumber);
            conn.once('pairingCode', (code) => {
                res.json({ pairingCode: code });
            });
            conn.once('error', (err) => {
                res.status(500).json({ error: err.message || 'Failed to connect' });
            });
        });
    }
    static logout(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { sessionId } = req.body;
            if (!sessionId) {
                return res.status(400).json({ error: 'sessionId is required' });
            }
            try {
                yield wa_connection_manager_1.ConnectionManager.logout(sessionId);
                const sessionFolder = path_1.default.join(__dirname, '../..', 'sessions', sessionId);
                if (fs_1.default.existsSync(sessionFolder)) {
                    fs_1.default.rmSync(sessionFolder, { recursive: true, force: true });
                    res.json({ success: true, message: 'Logged out and session deleted' });
                }
                else {
                    res.status(404).json({ error: 'Session not found' });
                }
            }
            catch (err) {
                res.status(500).json({ error: err.message });
            }
        });
    }
    static listSessions(_req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const sessions = yield session_model_1.Session.find();
                const activeSessionIds = sessions.filter(session => {
                    const sessionPath = path_1.default.join(__dirname, '../..', 'sessions', session.sessionId);
                    return fs_1.default.existsSync(sessionPath) && fs_1.default.existsSync(path_1.default.join(sessionPath, 'creds.json'));
                });
                const activeSessions = yield Promise.all(activeSessionIds.map((session) => __awaiter(this, void 0, void 0, function* () {
                    const connection = yield wa_connection_manager_1.ConnectionManager.getConnection(session.sessionId);
                    const sock = connection['sock'];
                    return {
                        sessionId: session.sessionId,
                        phoneNumber: session.phoneNumber,
                        name: session.name,
                        user: sock === null || sock === void 0 ? void 0 : sock.user
                    };
                })));
                res.json({ sessions: activeSessions });
            }
            catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
    }
    static updateSession(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { sessionId } = req.params;
                const { inbox_identifier } = req.body;
                const session = yield session_model_1.Session.findOneAndUpdate({ sessionId }, {
                    inbox_identifier
                }, { new: true });
                if (!session) {
                    res.status(404).json({ error: 'Session not found' });
                    return;
                }
                res.json(session);
            }
            catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
    }
    static sendText(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { sessionId, jid, text } = req.body;
            if (!jid || !text) {
                return res.status(400).json({ error: 'jid and text required' });
            }
            const conn = yield wa_connection_manager_1.ConnectionManager.getConnection(sessionId);
            const msgService = new wa_message_serive_1.MessageService(conn);
            try {
                const result = yield msgService.sendText(jid, text);
                res.json({ result });
            }
            catch (err) {
                res.status(500).json({ error: err.message });
            }
        });
    }
    sendMessage(sessionId, jid, text) {
        return __awaiter(this, void 0, void 0, function* () {
            const conn = yield wa_connection_manager_1.ConnectionManager.getConnection(sessionId);
            const msgService = new wa_message_serive_1.MessageService(conn);
            try {
                const result = yield msgService.sendText(jid, text);
                return result;
            }
            catch (err) {
                throw err;
            }
        });
    }
    static sendImage(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { sessionId, jid, caption } = req.body;
            const files = req.files;
            if (!jid || !req.files || files.length === 0) {
                return res.status(400).json({ error: 'jid and image file are required' });
            }
            const conn = yield wa_connection_manager_1.ConnectionManager.getConnection(sessionId);
            const msgService = new wa_message_serive_1.MessageService(conn);
            try {
                const results = [];
                for (const file of files) {
                    const result = yield msgService.sendImage(jid, file.buffer, caption);
                    results.push(result);
                }
                res.json({ results });
            }
            catch (err) {
                res.status(500).json({ error: err.message });
            }
        });
    }
    static sendDocument(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { sessionId, jid, fileName, mimetype } = req.body;
            const files = req.files;
            if (!jid || !req.files || files.length === 0) {
                return res.status(400).json({ error: 'jid, file, fileName and mimetype are required' });
            }
            const conn = yield wa_connection_manager_1.ConnectionManager.getConnection(sessionId);
            const msgService = new wa_message_serive_1.MessageService(conn);
            try {
                const results = [];
                for (const file of files) {
                    const result = yield msgService.sendDocument(jid, file.buffer, fileName, mimetype);
                    results.push(result);
                }
                res.json({ results });
            }
            catch (err) {
                res.status(500).json({ error: err.message });
            }
        });
    }
}
exports.WhatsappController = WhatsappController;
