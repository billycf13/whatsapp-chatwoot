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
exports.ChatwootClientApi = void 0;
const axios_1 = __importDefault(require("axios"));
const form_data_1 = __importDefault(require("form-data"));
const cwConfig_model_1 = require("../models/cwConfig.model");
class ChatwootClientApi {
    constructor(baseUrl) {
        this.initialized = false;
        this.baseUrl = baseUrl;
        this.initialized = true;
    }
    static fromSessionId(sessionId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const config = yield cwConfig_model_1.ChatwootConfig.findOne({ sessionId });
                if (!config) {
                    return {
                        success: false,
                        message: 'Konfigurasi Chatwoot belum diset untuk session ini. Silakan set konfigurasi terlebih dahulu.'
                    };
                }
                if (!config.baseUrl) {
                    return {
                        success: false,
                        message: 'Base URL Chatwoot belum diset. Silakan lengkapi konfigurasi.'
                    };
                }
                return new ChatwootClientApi(config.baseUrl);
            }
            catch (error) {
                console.error('Error initializing ChatwootClientApi:', error);
                return {
                    success: false,
                    message: 'Gagal menginisialisasi ChatwootClientApi. Periksa koneksi database.'
                };
            }
        });
    }
    ensureInitialized() {
        if (!this.initialized) {
            throw new Error('ChatwootClientApi not properly initialized. Use fromSessionId() method.');
        }
    }
    createContact(inboxIdentifier, contact) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            this.ensureInitialized();
            try {
                const response = yield axios_1.default.post(`${this.baseUrl}/public/api/v1/inboxes/${encodeURIComponent(inboxIdentifier)}/contacts`, contact, {
                    headers: { 'Content-Type': 'application/json' },
                    timeout: 10000
                });
                return response.data;
            }
            catch (error) {
                console.error('Error creating contact in Chatwoot:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
                throw error;
            }
        });
    }
    createConversation(inbox_identifier, contact_identifier) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            this.ensureInitialized();
            const url = `${this.baseUrl}/public/api/v1/inboxes/${encodeURIComponent(inbox_identifier)}/contacts/${encodeURIComponent(contact_identifier)}/conversations`;
            try {
                const response = yield axios_1.default.post(url, {}, {
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    timeout: 10000
                });
                return response.data;
            }
            catch (error) {
                console.error('Error creating conversation in Chatwoot:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
                throw error;
            }
        });
    }
    createMessage(inbox_identifier, contact_identifier, conversation_id, content) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            this.ensureInitialized();
            const url = `${this.baseUrl}/public/api/v1/inboxes/${encodeURIComponent(inbox_identifier)}/contacts/${encodeURIComponent(contact_identifier)}/conversations/${conversation_id}/messages`;
            try {
                const response = yield axios_1.default.post(url, {
                    content
                }, {
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    timeout: 10000
                });
                return response.data;
            }
            catch (error) {
                console.error('Error creating message in Chatwoot:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
                throw error;
            }
        });
    }
    createMessageWithAttachment(inbox_identifier_1, contact_identifier_1, conversation_id_1, content_1) {
        return __awaiter(this, arguments, void 0, function* (inbox_identifier, contact_identifier, conversation_id, content, attachments = []) {
            var _a, _b;
            this.ensureInitialized();
            if (attachments.length === 0) {
                return this.createMessage(inbox_identifier, contact_identifier, conversation_id, content);
            }
            const url = `${this.baseUrl}/public/api/v1/inboxes/${encodeURIComponent(inbox_identifier)}/contacts/${encodeURIComponent(contact_identifier)}/conversations/${conversation_id}/messages`;
            try {
                const results = [];
                for (const attachment of attachments) {
                    const formData = new form_data_1.default();
                    formData.append('content', content);
                    if (!Buffer.isBuffer(attachment.buffer)) {
                        throw new Error('Invalid buffer for attachment');
                    }
                    formData.append('attachments[]', attachment.buffer, {
                        filename: attachment.filename,
                        contentType: attachment.mimetype,
                        knownLength: attachment.buffer.length
                    });
                    const response = yield axios_1.default.post(url, formData, {
                        headers: formData.getHeaders(),
                        maxContentLength: Infinity,
                        maxBodyLength: Infinity,
                        timeout: 30000
                    });
                    results.push(response.data);
                }
                return results[0];
            }
            catch (error) {
                console.error('Error creating message with attachment:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
                // Fallback: kirim sebagai text saja
                try {
                    return yield this.createMessage(inbox_identifier, contact_identifier, conversation_id, `${content}\n\n[File attachment gagal dikirim: ${(_b = attachments[0]) === null || _b === void 0 ? void 0 : _b.filename}]`);
                }
                catch (fallbackError) {
                    console.error('Fallback message creation also failed:', fallbackError);
                    throw error; // Throw original error
                }
            }
        });
    }
}
exports.ChatwootClientApi = ChatwootClientApi;
