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
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsAppHandler = void 0;
const cw_appApi_1 = require("./cw.appApi");
const cw_clientApi_1 = require("./cw.clientApi");
const cwConfig_model_1 = require("../models/cwConfig.model");
const utils_1 = require("../utils");
class WhatsAppHandler {
    constructor(sessionId) {
        this.chatwootAppApi = null;
        this.chatwootClientApi = null;
        this.configInitialized = false;
        this.sock = null;
        this.messageMapping = new Map();
        // Tambahkan properti incomingMessages yang hilang
        this.incomingMessages = new Map();
        this.sessionId = sessionId;
        this.initializeApis();
    }
    initializeApis() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const appApiResult = yield cw_appApi_1.ChatwootAppApi.fromSessionId(this.sessionId);
                const clientApiResult = yield cw_clientApi_1.ChatwootClientApi.fromSessionId(this.sessionId);
                if ('success' in appApiResult && !appApiResult.success) {
                    console.log('ChatwootAppApi:', appApiResult.message);
                    return;
                }
                if ('success' in clientApiResult && !clientApiResult.success) {
                    console.log('ChatwootClientApi:', clientApiResult.message);
                    return;
                }
                this.chatwootAppApi = appApiResult;
                this.chatwootClientApi = clientApiResult;
                this.configInitialized = true;
                console.log('Chatwoot APIs initialized successfully');
            }
            catch (error) {
                console.error('Error initializing Chatwoot APIs:', error);
            }
        });
    }
    static getInstance(sessionId) {
        if (!WhatsAppHandler.instance) {
            WhatsAppHandler.instance = new WhatsAppHandler(sessionId);
        }
        return WhatsAppHandler.instance;
    }
    checkConfigInitialized() {
        if (!this.configInitialized || !this.chatwootAppApi || !this.chatwootClientApi) {
            console.log('Konfigurasi Chatwoot belum diset atau belum diinisialisasi');
            return false;
        }
        return true;
    }
    setSocket(sock) {
        this.sock = sock;
    }
    handleMessageUpdate(updates) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            if (!this.checkConfigInitialized())
                return;
            for (const update of updates) {
                const messageId = update.key.id;
                const status = (_a = update.update) === null || _a === void 0 ? void 0 : _a.status;
                console.log(update);
                if (status && messageId) {
                    yield this.updateChatwootMessageStatus(messageId, status);
                }
            }
        });
    }
    updateChatwootMessageStatus(whatsappMessageId, status) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.checkConfigInitialized())
                return;
            try {
                const messageInfo = this.messageMapping.get(whatsappMessageId);
                if (!messageInfo) {
                    // console.log('Message mapping not found for:', whatsappMessageId)
                    return;
                }
                if (messageInfo.lastStatus && status <= messageInfo.lastStatus) {
                    // console.log(`Ignoring status downgrade: ${whatsappMessageId} from ${messageInfo.lastStatus} to ${status}`)
                    return;
                }
                let chatwootStatus;
                switch (status) {
                    case 1:
                        chatwootStatus = 'pending';
                        break;
                    case 2:
                        chatwootStatus = 'Sending';
                        break;
                    case 3:
                        chatwootStatus = 'Delivered';
                        break;
                    case 4:
                        chatwootStatus = 'read';
                        break;
                    default:
                        console.log('Unknown status:', status);
                        return;
                }
                // console.log(`Updating message status in Chatwoot: ${whatsappMessageId} -> ${chatwootStatus} (from status ${messageInfo.lastStatus || 'none'} to ${status})`)
                messageInfo.lastStatus = status;
                this.messageMapping.set(whatsappMessageId, messageInfo);
                try {
                    yield this.chatwootAppApi.updateMessageStatus(messageInfo.conversation_id, messageInfo.message_id, chatwootStatus);
                    // console.log(`Message status updated successfully: ${chatwootStatus}`)
                }
                catch (apiError) {
                    console.error('Message status update API not available, logging status only:', chatwootStatus);
                }
            }
            catch (error) {
                console.error('Error updating message status in Chatwoot:', error);
            }
        });
    }
    storeMessageMapping(whatsappMessageId, conversation_id, message_id, phone) {
        console.log(`Storing message mapping: ${whatsappMessageId} -> conv:${conversation_id}, msg:${message_id}, phone:${phone}`);
        this.messageMapping.set(whatsappMessageId, {
            conversation_id,
            message_id,
            phone,
            lastStatus: 1
        });
        setTimeout(() => {
            this.messageMapping.delete(whatsappMessageId);
            console.log(`Cleaned up message mapping: ${whatsappMessageId}`);
        }, 24 * 60 * 60 * 1000);
    }
    getMappingCount() {
        return this.messageMapping.size;
    }
    getAllMappings() {
        return Array.from(this.messageMapping.keys());
    }
    handleMessageUpsert(messages) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            if (!this.checkConfigInitialized())
                return;
            console.log('pesan masuk ', messages);
            console.log('pesan masuk ', messages[0].message);
            const sessionId = this.sessionId;
            const getInboxIdentifier = yield cwConfig_model_1.ChatwootConfig.findOne({ sessionId });
            if ((getInboxIdentifier === null || getInboxIdentifier === void 0 ? void 0 : getInboxIdentifier.inboxIdentifier) !== '') {
                const inbox_identifier = getInboxIdentifier === null || getInboxIdentifier === void 0 ? void 0 : getInboxIdentifier.inboxIdentifier;
                for (const message of messages) {
                    if (!message.key.fromMe &&
                        !((_a = message.key.remoteJid) === null || _a === void 0 ? void 0 : _a.endsWith('@g.us')) &&
                        !((_b = message.key.remoteJid) === null || _b === void 0 ? void 0 : _b.includes('status@broadcast'))) {
                        yield this.processIncomingMessage(message, inbox_identifier);
                    }
                    else if (message.key.fromMe) {
                        yield this.processOutgoingMessage(message);
                    }
                }
            }
        });
    }
    processIncomingMessage(message, inbox_identifier) {
        return __awaiter(this, void 0, void 0, function* () {
            const jid = message.key.remoteJid;
            const phone = jid.split('@')[0];
            const messageId = message.key.id;
            const { messageContent, attachments } = yield this.processMessageContent(message);
            // Skip jika tidak ada konten (seperti protocol messages)
            if (!messageContent && attachments.length === 0) {
                console.log('Skipping message with no content (likely system message)');
                return;
            }
            const { contact_identifier, conversation_id } = yield this.handleContactAndConversation(message, phone, inbox_identifier);
            // Simpan pesan masuk untuk tracking read status
            this.incomingMessages.set(messageId, {
                messageId,
                jid,
                conversationId: conversation_id
            });
            // Auto-cleanup setelah 24 jam
            setTimeout(() => {
                this.incomingMessages.delete(messageId);
            }, 24 * 60 * 60 * 1000);
            yield this.sendMessageToChatwoot(inbox_identifier, contact_identifier, conversation_id, messageContent, attachments);
        });
    }
    // Method untuk menandai conversation sebagai dibaca di WhatsApp
    markConversationAsRead(conversationId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.sock) {
                console.log('WhatsApp socket not available');
                return;
            }
            try {
                const messagesToRead = [];
                // Cari semua pesan masuk untuk conversation ini
                for (const [messageId, messageInfo] of this.incomingMessages.entries()) {
                    if (messageInfo.conversationId === conversationId) {
                        messagesToRead.push({
                            remoteJid: messageInfo.jid,
                            id: messageInfo.messageId
                        });
                    }
                }
                if (messagesToRead.length > 0) {
                    // Gunakan Baileys readMessages untuk menandai sebagai dibaca
                    yield this.sock.readMessages(messagesToRead);
                    console.log(`✅ Marked ${messagesToRead.length} WhatsApp messages as read for conversation ${conversationId}`);
                    // Hapus dari tracking setelah dibaca
                    messagesToRead.forEach(msg => {
                        this.incomingMessages.delete(msg.id);
                    });
                }
                else {
                    console.log(`No unread messages found for conversation ${conversationId}`);
                }
            }
            catch (error) {
                console.error('❌ Error marking conversation as read:', error);
            }
        });
    }
    processOutgoingMessage(message) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const msgId = message.key.id;
            const msgInfo = this.messageMapping.get(msgId);
            if (!msgInfo) {
                const phone = (_a = message.key.remoteJid) === null || _a === void 0 ? void 0 : _a.split('@')[0];
                const { messageContent, attachments } = yield this.processMessageContent(message);
                const getContact = yield this.chatwootAppApi.searchContact(phone);
                if (getContact.payload.length === 0) {
                    console.log('Contact not found');
                    return;
                }
                const contact_id = getContact.payload[0].id;
                const getConversation = yield this.chatwootAppApi.getConversationId(contact_id);
                if (!getConversation.payload || getConversation.payload.length === 0) {
                    console.log('Conversation not found');
                    return;
                }
                const conversation_id = getConversation.payload[0].id;
                let createMessage;
                if (attachments.length > 0) {
                    createMessage = yield this.chatwootAppApi.createMessageWithAttachment(conversation_id, messageContent, attachments);
                }
                else {
                    createMessage = yield this.chatwootAppApi.createMessage(conversation_id, messageContent, 'outgoing');
                }
                if (createMessage) {
                    this.storeMessageMapping(msgId, conversation_id, createMessage.id, phone);
                    yield this.updateChatwootMessageStatus(msgId, 4);
                }
            }
        });
    }
    processMessageContent(message) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e;
            let messageContent = '';
            let attachments = [];
            // Tangani pesan teks biasa
            if ((_a = message.message) === null || _a === void 0 ? void 0 : _a.conversation) {
                messageContent = message.message.conversation;
                return { messageContent, attachments };
            }
            // Tangani extended text message (pesan teks dengan format atau context)
            if ((_c = (_b = message.message) === null || _b === void 0 ? void 0 : _b.extendedTextMessage) === null || _c === void 0 ? void 0 : _c.text) {
                messageContent = message.message.extendedTextMessage.text;
                return { messageContent, attachments };
            }
            // Skip protocol messages (sistem messages seperti ephemeral settings)
            if ((_d = message.message) === null || _d === void 0 ? void 0 : _d.protocolMessage) {
                console.log('Skipping protocol message (system message)');
                return { messageContent: '', attachments: [] };
            }
            // Tangani media messages
            if ((0, utils_1.hasWhatsAppMedia)(message.message)) {
                try {
                    console.log('Processing WhatsApp media...', {
                        messageType: Object.keys(message.message || {}),
                        hasMedia: (0, utils_1.hasWhatsAppMedia)(message.message),
                        hasSocket: !!this.sock
                    });
                    const processedAttachment = yield (0, utils_1.processWhatsAppMedia)(message, this.sock);
                    if (processedAttachment) {
                        console.log('Media processed successfully:', {
                            filename: processedAttachment.filename,
                            mimetype: processedAttachment.mimetype,
                            bufferSize: (_e = processedAttachment.buffer) === null || _e === void 0 ? void 0 : _e.length,
                            category: processedAttachment.category
                        });
                        attachments.push({
                            buffer: processedAttachment.buffer,
                            mimetype: processedAttachment.mimetype,
                            filename: processedAttachment.filename
                        });
                    }
                    else {
                        console.log('No processed attachment returned');
                    }
                    messageContent = (0, utils_1.getWhatsAppMediaCaption)(message.message) || '';
                }
                catch (error) {
                    console.error('Error processing media:', error);
                    const mediaInfo = (0, utils_1.getWhatsAppMediaInfo)(message.message);
                    messageContent = `[${this.getMediaErrorMessage(mediaInfo.mediaType)} - Gagal diunduh]`;
                }
            }
            else {
                messageContent = '[Pesan tidak didukung]';
            }
            console.log('Final message content:', {
                messageContent,
                attachmentCount: attachments.length
            });
            return { messageContent, attachments };
        });
    }
    handleContactAndConversation(message, phone, inbox_identifier) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const contact = yield this.chatwootAppApi.searchContact(phone);
            let contact_identifier;
            let conversation_id;
            if (contact.payload.length === 0) {
                const identifier = message.key.remoteJid;
                const phone_number = '+' + ((_a = message.key.remoteJid) === null || _a === void 0 ? void 0 : _a.split('@')[0]);
                const name = message.pushName || phone_number;
                const createContact = yield this.chatwootClientApi.createContact(inbox_identifier, {
                    identifier: identifier || '',
                    name: name,
                    phone_number: phone_number
                });
                // contact_identifier = createContact.source_id
                if (createContact) {
                    console.log('contact created successfully');
                }
                const searchContact = yield this.chatwootAppApi.searchContact(phone);
                console.log('search contact', searchContact.payload);
                contact_identifier = searchContact.payload[0].contact_inboxes[0].source_id;
                console.log('contact identifier: ', contact_identifier);
                console.log('innbox identifier: ', inbox_identifier);
                const createConversation = yield this.chatwootClientApi.createConversation(inbox_identifier, contact_identifier);
                conversation_id = createConversation.id;
                console.log('create conversation: ', createConversation);
            }
            else {
                contact_identifier = contact.payload[0].contact_inboxes[0].source_id;
                const contact_id = contact.payload[0].id;
                let getConversation = yield this.chatwootAppApi.getConversationId(contact_id);
                if (!getConversation.payload || getConversation.payload.length === 0) {
                    const newConversation = yield this.chatwootClientApi.createConversation(inbox_identifier, contact_id);
                    conversation_id = newConversation.id;
                }
                else {
                    conversation_id = getConversation.payload[0].id;
                }
            }
            return { contact_identifier, conversation_id };
        });
    }
    getMediaErrorMessage(mediaType) {
        switch (mediaType) {
            case 'image': return 'Gambar';
            case 'video': return 'Video';
            case 'audio': return 'Audio';
            case 'document': return 'Dokumen';
            case 'sticker': return 'Stiker';
            default: return 'Media';
        }
    }
    handleContactUpsert(contacts) {
        for (const contact of contacts) {
            console.log('Contact Update:', {
                id: contact.id,
                name: contact.name || contact.notify,
                contact: contact
            });
        }
    }
    sendMessageToChatwoot(inbox_identifier_1, contact_identifier_1, conversation_id_1, content_1) {
        return __awaiter(this, arguments, void 0, function* (inbox_identifier, contact_identifier, conversation_id, content, attachments = []) {
            if (!this.checkConfigInitialized())
                return;
            try {
                if (attachments.length > 0) {
                    console.log('Sending message with attachments:', {
                        attachmentCount: attachments.length,
                        attachmentInfo: attachments.map(att => {
                            var _a;
                            return ({
                                filename: att.filename,
                                mimetype: att.mimetype,
                                bufferSize: (_a = att.buffer) === null || _a === void 0 ? void 0 : _a.length
                            });
                        })
                    });
                    yield this.chatwootClientApi.createMessageWithAttachment(inbox_identifier, contact_identifier, conversation_id, content, attachments);
                }
                else {
                    yield this.chatwootClientApi.createMessage(inbox_identifier, contact_identifier, conversation_id, content);
                }
                console.log('Message sent successfully to Chatwoot');
            }
            catch (error) {
                console.error('Error sending message to Chatwoot:', error);
            }
        });
    }
    reinitializeApis() {
        return __awaiter(this, void 0, void 0, function* () {
            this.configInitialized = false;
            this.chatwootAppApi = null;
            this.chatwootClientApi = null;
            yield this.initializeApis();
        });
    }
}
exports.WhatsAppHandler = WhatsAppHandler;
