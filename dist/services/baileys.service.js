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
exports.BaileysConnection = void 0;
const baileys_1 = require("@whiskeysockets/baileys");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const events_1 = require("events");
const wa_handler_1 = require("./wa.handler");
const session_model_1 = require("../models/session.model");
class BaileysConnection extends events_1.EventEmitter {
    constructor(sessionId, usePairingCode, phoneNumber) {
        super();
        this.sock = null;
        this.usePairingCode = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 10;
        this.sessionId = sessionId;
        this.sessionFolder = path_1.default.join(__dirname, '../..', 'sessions');
        this.authFolder = path_1.default.join(this.sessionFolder, this.sessionId);
        this.usePairingCode = usePairingCode;
        this.phoneNumber = phoneNumber;
        this.handler = wa_handler_1.WhatsAppHandler.getInstance(sessionId); // Gunakan getInstance() untuk singleton
    }
    connect() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.startConnection();
        });
    }
    startConnection() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { state, saveCreds } = yield (0, baileys_1.useMultiFileAuthState)(this.authFolder);
                const { version } = yield (0, baileys_1.fetchLatestBaileysVersion)();
                this.sock = (0, baileys_1.makeWASocket)({
                    version,
                    auth: {
                        creds: state.creds,
                        keys: (0, baileys_1.makeCacheableSignalKeyStore)(state.keys)
                    }
                });
                // ✅ Set socket ke handler setelah socket dibuat
                this.handler.setSocket(this.sock);
                this.sock.ev.on('connection.update', (update) => __awaiter(this, void 0, void 0, function* () {
                    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
                    if (update.qr) {
                        if (!this.usePairingCode) {
                            this.emit('qr', update.qr);
                        }
                        else {
                            const code = yield this.sock.requestPairingCode(this.phoneNumber);
                            this.emit('pairingCode', code);
                        }
                    }
                    if (update.connection === 'close') {
                        const shouldReconnect = ((_c = (_b = (_a = update.lastDisconnect) === null || _a === void 0 ? void 0 : _a.error) === null || _b === void 0 ? void 0 : _b.output) === null || _c === void 0 ? void 0 : _c.statusCode) !== baileys_1.DisconnectReason.loggedOut;
                        if (shouldReconnect) {
                            this.reconnectAttempts++;
                            if (this.reconnectAttempts > this.maxReconnectAttempts) {
                                console.error('Max reconnect attempts reached. Stopping reconnect.');
                                return;
                            }
                            const delay = Math.min(3000 * this.reconnectAttempts, 6000);
                            console.log(`connection close, reconnecting in ${delay / 1000}s... (attempt ${this.reconnectAttempts}) `);
                            setTimeout(() => this.startConnection(), delay);
                        }
                        else {
                            this.reconnectAttempts = 0;
                            console.log('Logged out, connection will not be restored');
                            try {
                                fs_1.default.rmSync(this.authFolder, { recursive: true, force: true });
                                console.log(`Deleted session folder: ${this.authFolder}`);
                                yield session_model_1.Session.deleteOne({ sessionId: this.sessionId });
                                console.log(`Deleted session from database: ${this.sessionId}`);
                            }
                            catch (err) {
                                console.log(`Failed to delete session folder ${this.authFolder}`, err);
                                if (err instanceof Error) {
                                    console.log(`Failed to delete session data ${err.message}`);
                                }
                            }
                        }
                    }
                    else if (update.connection === 'open') {
                        this.reconnectAttempts = 0;
                        // ✅ Update socket reference saat connection terbuka
                        this.handler.setSocket(this.sock);
                        // Ambil nomor HP dari user.id
                        const userId = (_e = (_d = this.sock) === null || _d === void 0 ? void 0 : _d.user) === null || _e === void 0 ? void 0 : _e.id;
                        const phoneNumber = userId ? userId.split(/[:@]/)[0] : '';
                        const name = ((_g = (_f = this.sock) === null || _f === void 0 ? void 0 : _f.user) === null || _g === void 0 ? void 0 : _g.name) || '';
                        yield session_model_1.Session.findOneAndUpdate({ sessionId: this.sessionId }, {
                            phoneNumber,
                            name
                        }, { upsert: true, new: true });
                        console.log('WhatsApp Connected:' + ((_j = (_h = this.sock) === null || _h === void 0 ? void 0 : _h.user) === null || _j === void 0 ? void 0 : _j.id) + ' - ' + ((_l = (_k = this.sock) === null || _k === void 0 ? void 0 : _k.user) === null || _l === void 0 ? void 0 : _l.name));
                    }
                }));
                this.sock.ev.on('creds.update', saveCreds);
                this.sock.ev.on('messages.update', updates => {
                    this.handler.handleMessageUpdate(updates);
                });
                this.sock.ev.on('messages.upsert', (m) => __awaiter(this, void 0, void 0, function* () {
                    this.handler.handleMessageUpsert(m.messages);
                }));
                this.sock.ev.on('contacts.upsert', (contacts) => __awaiter(this, void 0, void 0, function* () {
                    this.handler.handleContactUpsert(contacts);
                }));
            }
            catch (error) {
                console.error('Connection failed:', error);
                setTimeout(() => this.startConnection(), 5000);
            }
        });
    }
}
exports.BaileysConnection = BaileysConnection;
