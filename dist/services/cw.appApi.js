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
exports.ChatwootAppApi = void 0;
const axios_1 = __importDefault(require("axios"));
const cwConfig_model_1 = require("../models/cwConfig.model");
class ChatwootAppApi {
    constructor(config) {
        this.initialized = false;
        this.baseUrl = config.baseUrl;
        this.agentApiToken = config.agentApiToken;
        this.botApiToken = config.botApiToken;
        this.accountId = config.accountId;
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
                if (!config.baseUrl || !config.agentApiToken || !config.botApiToken || !config.accountId) {
                    return {
                        success: false,
                        message: 'Konfigurasi Chatwoot tidak lengkap. Pastikan semua field telah diisi (baseUrl, agentApiToken, botApiToken, accountId).'
                    };
                }
                return new ChatwootAppApi({
                    baseUrl: config.baseUrl,
                    agentApiToken: config.agentApiToken,
                    botApiToken: config.botApiToken,
                    accountId: config.accountId
                });
            }
            catch (error) {
                console.error('Error initializing ChatwootAppApi:', error);
                return {
                    success: false,
                    message: 'Gagal menginisialisasi ChatwootAppApi. Periksa koneksi database.'
                };
            }
        });
    }
    ensureInitialized() {
        if (!this.initialized) {
            throw new Error('ChatwootAppApi not properly initialized. Use fromSessionId() method.');
        }
    }
    searchContact(q) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            this.ensureInitialized();
            const encodedQuery = encodeURIComponent(q);
            const url = `${this.baseUrl}/api/v1/accounts/${this.accountId}/contacts/search?sort=phone_number&q=${encodedQuery}`;
            try {
                const response = yield axios_1.default.get(url, {
                    headers: {
                        'Content-Type': 'application/json',
                        'api_access_token': this.agentApiToken
                    },
                    timeout: 10000
                });
                return response.data;
            }
            catch (error) {
                console.error('Error fetching contacts:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
                throw error;
            }
        });
    }
    createMessage(conversation_id_1, content_1) {
        return __awaiter(this, arguments, void 0, function* (conversation_id, content, messageType = 'outgoing') {
            var _a;
            this.ensureInitialized();
            const url = `${this.baseUrl}/api/v1/accounts/${this.accountId}/conversations/${conversation_id}/messages`;
            try {
                const response = yield axios_1.default.post(url, {
                    content,
                    message_type: messageType
                }, {
                    headers: {
                        'Content-Type': 'application/json',
                        'api_access_token': this.botApiToken
                    },
                    timeout: 10000
                });
                return response.data;
            }
            catch (error) {
                console.error('Error creating message:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
                throw error;
            }
        });
    }
    getConversationId(contact_id) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            this.ensureInitialized();
            const url = `${this.baseUrl}/api/v1/accounts/${this.accountId}/contacts/${contact_id}/conversations`;
            try {
                const response = yield axios_1.default.get(url, {
                    headers: {
                        'Content-Type': 'application/json',
                        'api_access_token': this.agentApiToken
                    },
                    timeout: 10000
                });
                return response.data;
            }
            catch (error) {
                console.error('Error getting conversation ID:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
                throw error;
            }
        });
    }
    showContact(contact_id) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            this.ensureInitialized();
            const url = `${this.baseUrl}/api/v1/accounts/${this.accountId}/contacts/${contact_id}`;
            try {
                const response = yield axios_1.default.get(url, {
                    headers: {
                        'Content-Type': 'application/json',
                        'api_access_token': this.agentApiToken
                    },
                    timeout: 10000
                });
                return response.data;
            }
            catch (error) {
                console.error('Error showing contact:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
                throw error;
            }
        });
    }
    getContactConversation(contact_id) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            this.ensureInitialized();
            const url = `${this.baseUrl}/api/v1/accounts/${this.accountId}/contacts/${contact_id}/conversations`;
            try {
                const response = yield axios_1.default.get(url, {
                    headers: {
                        'Content-Type': 'application/json',
                        'api_access_token': this.agentApiToken
                    },
                    timeout: 10000
                });
                return response.data;
            }
            catch (error) {
                console.error('Error getting contact conversation:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
                throw error;
            }
        });
    }
    createMessageWithAttachment(conversation_id_1, content_1) {
        return __awaiter(this, arguments, void 0, function* (conversation_id, content, attachments = []) {
            var _a;
            this.ensureInitialized();
            const url = `${this.baseUrl}/api/v1/accounts/${this.accountId}/conversations/${conversation_id}/messages`;
            try {
                const FormData = require('form-data');
                const formData = new FormData();
                formData.append('content', content);
                formData.append('message_type', 'outgoing');
                for (const attachment of attachments) {
                    if (!Buffer.isBuffer(attachment.buffer)) {
                        throw new Error('Invalid buffer for attachment');
                    }
                    formData.append('attachments[]', attachment.buffer, {
                        filename: attachment.filename,
                        contentType: attachment.mimetype,
                    });
                }
                const response = yield axios_1.default.post(url, formData, {
                    headers: Object.assign(Object.assign({}, formData.getHeaders()), { 'api_access_token': this.botApiToken }),
                    maxContentLength: Infinity,
                    maxBodyLength: Infinity,
                    timeout: 30000
                });
                return response.data;
            }
            catch (error) {
                console.error('Error creating message with attachment via App API:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
                throw error;
            }
        });
    }
    updateMessageStatus(conversation_id, message_id, status) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            this.ensureInitialized();
            const url = `${this.baseUrl}/api/v1/accounts/${this.accountId}/conversations/${conversation_id}/messages/${message_id}`;
            try {
                const response = yield axios_1.default.patch(url, {
                    status: status
                }, {
                    headers: {
                        'Content-Type': 'application/json',
                        'api_access_token': this.agentApiToken
                    },
                    timeout: 10000
                });
                console.log('Message status updated successfully:', response.data);
                return response.data;
            }
            catch (error) {
                console.error('Error updating message status:', {
                    status: (_a = error.response) === null || _a === void 0 ? void 0 : _a.status,
                    statusText: (_b = error.response) === null || _b === void 0 ? void 0 : _b.statusText,
                    data: (_c = error.response) === null || _c === void 0 ? void 0 : _c.data,
                    message: error.message
                });
                throw error;
            }
        });
    }
}
exports.ChatwootAppApi = ChatwootAppApi;
