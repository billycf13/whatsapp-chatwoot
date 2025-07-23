"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.WebhookController = void 0;
const cw_appApi_1 = require("../services/cw.appApi");
const wa_message_serive_1 = require("../services/wa.message.serive");
const wa_connection_manager_1 = require("../services/wa.connection.manager");
const wa_handler_1 = require("../services/wa.handler");
const path = __importStar(require("path"));
// Import utility functions
const utils_1 = require("../utils");
// Hapus instansiasi global
// const chatwootAppApi = new ChatwootAppApi()
// const whatsappController = new WhatsappController()
class WebhookController {
    // Fungsi untuk mendeteksi MIME type dari buffer file
    static detectMimeTypeFromBuffer(buffer) {
        // Deteksi berdasarkan magic bytes/file signature
        const header = buffer.toString('hex', 0, 10).toUpperCase();
        // Image formats
        if (header.startsWith('FFD8FF'))
            return 'image/jpeg';
        if (header.startsWith('89504E47'))
            return 'image/png';
        if (header.startsWith('47494638'))
            return 'image/gif';
        if (header.startsWith('52494646') && buffer.toString('ascii', 8, 12) === 'WEBP')
            return 'image/webp';
        if (header.startsWith('424D'))
            return 'image/bmp';
        // Document formats
        if (header.startsWith('25504446'))
            return 'application/pdf';
        if (header.startsWith('504B0304')) {
            // ZIP-based formats
            const content = buffer.toString('ascii', 0, 100);
            if (content.includes('word/'))
                return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
            if (content.includes('xl/'))
                return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
            if (content.includes('ppt/'))
                return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
            return 'application/zip';
        }
        // Video formats
        if (header.startsWith('000000') && (header.includes('667479704D503420') || header.includes('6674797069736F6D')))
            return 'video/mp4';
        if (header.startsWith('1A45DFA3'))
            return 'video/webm';
        if (header.startsWith('464C5601'))
            return 'video/x-flv';
        // Audio formats
        if (header.startsWith('494433') || header.startsWith('FFFB') || header.startsWith('FFF3'))
            return 'audio/mpeg';
        if (header.startsWith('4F676753'))
            return 'audio/ogg';
        if (header.startsWith('52494646') && buffer.toString('ascii', 8, 12) === 'WAVE')
            return 'audio/wav';
        if (header.startsWith('664C6143'))
            return 'audio/flac';
        // Text formats
        if (header.startsWith('EFBBBF') || buffer.toString('ascii', 0, 100).match(/^[\x20-\x7E\s]*$/))
            return 'text/plain';
        return 'application/octet-stream'; // Default fallback
    }
    // Fungsi untuk mendapatkan ekstensi file berdasarkan MIME type
    static getFileExtension(mimeType, originalName) {
        // Cek jika file sudah memiliki ekstensi yang valid
        if (originalName && originalName.includes('.')) {
            const ext = path.extname(originalName).toLowerCase();
            const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.mp4', '.avi', '.mov', '.webm', '.flv', '.mp3', '.ogg', '.wav', '.flac', '.zip', '.rar'];
            if (validExtensions.includes(ext)) {
                return originalName;
            }
        }
        // Mapping MIME type ke ekstensi
        const mimeToExt = {
            // Images
            'image/jpeg': '.jpg',
            'image/jpg': '.jpg',
            'image/png': '.png',
            'image/gif': '.gif',
            'image/webp': '.webp',
            'image/bmp': '.bmp',
            // Documents
            'application/pdf': '.pdf',
            'application/msword': '.doc',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
            'application/vnd.ms-excel': '.xls',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
            'application/vnd.ms-powerpoint': '.ppt',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
            'text/plain': '.txt',
            'application/zip': '.zip',
            'application/x-rar-compressed': '.rar',
            // Videos
            'video/mp4': '.mp4',
            'video/avi': '.avi',
            'video/quicktime': '.mov',
            'video/webm': '.webm',
            'video/x-flv': '.flv',
            // Audio
            'audio/mpeg': '.mp3',
            'audio/mp3': '.mp3',
            'audio/ogg': '.ogg',
            'audio/wav': '.wav',
            'audio/flac': '.flac',
            // Fallback
            'application/octet-stream': '.bin',
            'file': '.bin' // Handle Chatwoot's generic 'file' type
        };
        const extension = mimeToExt[mimeType] || '.bin';
        const baseName = originalName || `file_${Date.now()}`;
        // Remove existing extension if any
        const nameWithoutExt = baseName.includes('.') ? baseName.substring(0, baseName.lastIndexOf('.')) : baseName;
        return nameWithoutExt + extension;
    }
    static handleChatwootWebhook(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const sessionId = req.params.sessionId;
            const event = req.body;
            // Buat unique key untuk message
            const messageKey = `${event.id}_${(_a = event.conversation) === null || _a === void 0 ? void 0 : _a.id}_${sessionId}`;
            const currentTime = Date.now();
            // Cek apakah message sudah diproses dalam 5 menit terakhir
            if (WebhookController.processedMessages.has(messageKey)) {
                const processedTime = WebhookController.processedMessages.get(messageKey);
                if (currentTime - processedTime < WebhookController.CACHE_DURATION) {
                    // console.log('Duplicate message detected, skipping:', messageKey)
                    res.send('Duplicate webhook ignored!');
                    return;
                }
            }
            // Bersihkan cache yang sudah expired
            WebhookController.cleanExpiredCache(currentTime);
            // Proses message_created DAN message_updated untuk outgoing messages
            if ((event.event === 'message_created' || event.event === 'message_updated') &&
                event.sender.name !== 'syncAgent' &&
                event.message_type === 'outgoing') {
                // Tandai message sebagai sudah diproses
                WebhookController.processedMessages.set(messageKey, currentTime);
                // Inisialisasi ChatwootAppApi dengan sessionId
                const chatwootAppApiResult = yield cw_appApi_1.ChatwootAppApi.fromSessionId(sessionId);
                // Cek apakah hasil adalah ApiResponse (error) atau ChatwootAppApi instance
                if ('success' in chatwootAppApiResult && !chatwootAppApiResult.success) {
                    console.error('Chatwoot configuration not found for session:', sessionId, chatwootAppApiResult.message);
                    res.status(400).json({
                        error: 'Konfigurasi Chatwoot tidak ditemukan',
                        message: chatwootAppApiResult.message
                    });
                    return;
                }
                // Jika berhasil, chatwootAppApiResult adalah instance ChatwootAppApi
                const chatwootAppApi = chatwootAppApiResult;
                const contact_id = Number(event.conversation.contact_inbox.contact_id);
                try {
                    const showContact = yield chatwootAppApi.showContact(contact_id);
                    const identifier = showContact.payload.identifier;
                    const jid = identifier;
                    const message = event.content;
                    const contentType = event.content_type;
                    const conversation_id = event.conversation.id;
                    const message_id = event.id;
                    // Dapatkan instance WhatsAppHandler dengan sessionId
                    const waHandler = wa_handler_1.WhatsAppHandler.getInstance(sessionId);
                    try {
                        // Dapatkan koneksi WhatsApp
                        const conn = yield wa_connection_manager_1.ConnectionManager.getConnection(sessionId);
                        const msgService = new wa_message_serive_1.MessageService(conn);
                        let sendResult = null;
                        // Periksa attachment terlebih dahulu
                        if (event.attachments && event.attachments.length > 0) {
                            // Tangani pesan dengan attachment menggunakan utility
                            // console.log('Processing attachments:', event.attachments.length)
                            for (const attachment of event.attachments) {
                                try {
                                    // Gunakan utility function untuk process attachment
                                    // Ganti baris 198-201:
                                    const processedAttachment = yield (0, utils_1.processAttachmentForWhatsApp)(attachment.data_url, {
                                        originalName: attachment.file_name,
                                        originalMimeType: attachment.file_type,
                                        maxSize: 50 * 1024 * 1024, // 50MB
                                        // HAPUS allowedTypes atau gunakan MIME types spesifik
                                        // allowedTypes: ['image', 'video', 'audio', 'document'], // ❌ SALAH
                                        allowedTypes: [
                                            // Images
                                            'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
                                            // Videos  
                                            'video/mp4', 'video/mpeg', 'video/quicktime', 'video/webm', 'video/3gpp',
                                            // Audio
                                            'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/amr',
                                            // Documents
                                            'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                                            'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                                            'text/plain', 'text/csv'
                                        ], // ✅ BENAR
                                        generateTimestamp: true
                                    });
                                    // console.log('Processed attachment:', {
                                    //     originalName: attachment.file_name,
                                    //     processedName: processedAttachment.filename,
                                    //     mimeType: processedAttachment.mimetype,
                                    //     category: processedAttachment.category,
                                    //     size: processedAttachment.size
                                    // })
                                    // Kirim berdasarkan kategori file
                                    switch (processedAttachment.category) {
                                        case 'image':
                                            if (message && message.trim()) {
                                                // console.log('Sending image with caption:', processedAttachment.filename, 'to', jid)
                                                sendResult = yield msgService.sendImage(jid, processedAttachment.buffer, message);
                                            }
                                            else {
                                                // console.log('Sending image without caption:', processedAttachment.filename, 'to', jid)
                                                sendResult = yield msgService.sendImage(jid, processedAttachment.buffer);
                                            }
                                            break;
                                        case 'video':
                                            if (message && message.trim()) {
                                                // console.log('Sending video with caption:', processedAttachment.filename, 'to', jid)
                                                sendResult = yield msgService.sendVideo(jid, processedAttachment.buffer, message);
                                            }
                                            else {
                                                // console.log('Sending video without caption:', processedAttachment.filename, 'to', jid)
                                                sendResult = yield msgService.sendVideo(jid, processedAttachment.buffer);
                                            }
                                            break;
                                        case 'audio':
                                            // console.log('Sending audio:', processedAttachment.filename, 'to', jid)
                                            sendResult = yield msgService.sendAudio(jid, processedAttachment.buffer);
                                            if (message && message.trim()) {
                                                // console.log('Sending text message after audio:', message)
                                                yield msgService.sendText(jid, message);
                                            }
                                            break;
                                        default: // document
                                            // console.log('Sending document:', processedAttachment.filename, 'to', jid)
                                            sendResult = yield msgService.sendDocument(jid, processedAttachment.buffer, processedAttachment.filename, processedAttachment.mimetype);
                                            if (message && message.trim()) {
                                                // console.log('Sending text message after document:', message)
                                                yield msgService.sendText(jid, message);
                                            }
                                            break;
                                    }
                                    // Simpan mapping setelah berhasil mengirim
                                    if (sendResult && sendResult.key && sendResult.key.id) {
                                        const phone = jid.split('@')[0];
                                        waHandler.storeMessageMapping(sendResult.key.id, conversation_id, message_id, phone);
                                        // console.log('Message mapping stored for attachment:', sendResult.key.id)
                                    }
                                }
                                catch (attachmentError) {
                                    console.error('Error processing attachment:', attachment.file_name, attachmentError);
                                    yield msgService.sendText(jid, `❌ Gagal mengirim file: ${attachment.file_name}`);
                                }
                            }
                        }
                        else if (contentType === 'text' && message && message.trim()) {
                            // Kirim pesan text saja
                            // console.log('Sending text only:', sessionId, jid, message)
                            sendResult = yield msgService.sendText(jid, message);
                            // console.log('Text sent:', sendResult)
                            // Simpan mapping setelah berhasil mengirim text
                            if (sendResult && sendResult.key && sendResult.key.id) {
                                const phone = jid.split('@')[0];
                                waHandler.storeMessageMapping(sendResult.key.id, conversation_id, message_id, phone);
                                // console.log('Message mapping stored for text:', sendResult.key.id)
                            }
                        }
                        else {
                            // console.log('Unsupported content type or empty message:', contentType, message)
                            if (!event.attachments || event.attachments.length === 0) {
                                // Kirim pesan error kembali ke Chatwoot alih-alih ke WhatsApp
                                try {
                                    yield chatwootAppApi.createMessage(conversation_id, '❌ Jenis pesan tidak didukung atau pesan kosong', 'outgoing');
                                    // console.log('Error message sent back to Chatwoot for unsupported content')
                                }
                                catch (chatwootError) {
                                    console.error('Failed to send error message to Chatwoot:', chatwootError);
                                }
                            }
                        }
                        // Debug: tampilkan jumlah mapping yang tersimpan
                        // console.log(`Total message mappings stored: ${waHandler.getMappingCount()}`)
                    }
                    catch (error) {
                        console.error('Error in webhook handler:', error);
                    }
                }
                catch (chatwootError) {
                    console.error('Error calling Chatwoot API:', chatwootError);
                    res.status(500).json({
                        error: 'Gagal mengakses API Chatwoot',
                        message: chatwootError instanceof Error ? chatwootError.message : 'Unknown error'
                    });
                    return;
                }
            }
            else if (event.event === 'conversation_typing_on') {
                // console.log('Agent started typing - marking messages as read:', {
                //     conversation_id: event.conversation.id,
                //     unread_count: event.conversation.unread_count,
                //     agent_last_seen_at: event.conversation.agent_last_seen_at
                // })
                // Deteksi jika agent membaca conversation (agent_last_seen_at berubah)
                if (event.conversation.unread_count === 0) {
                    const waHandler = wa_handler_1.WhatsAppHandler.getInstance(sessionId);
                    yield waHandler.markConversationAsRead(event.conversation.id);
                    // console.log('Marked WhatsApp messages as read for conversation:', event.conversation.id)
                }
            }
            else if (event.event === 'conversation_updated') {
                // console.log('Conversation updated event:', {
                //     id: event.id,
                //     status: event.status,
                //     agent_last_seen_at: event.agent_last_seen_at,
                //     unread_count: event.unread_count
                // })
                // Backup trigger jika conversation_typing_on tidak cukup
                if (event.unread_count === 0 && event.agent_last_seen_at) {
                    const waHandler = wa_handler_1.WhatsAppHandler.getInstance(sessionId);
                    yield waHandler.markConversationAsRead(event.id);
                    // console.log('Marked WhatsApp messages as read for conversation:', event.id)
                }
            }
            else if (event.event === 'message_updated') {
                // console.log('Message updated event (non-outgoing):', {
                //     id: event.id,
                //     event: event.event,
                //     message_type: event.message_type,
                //     sender_type: event.sender?.type
                // })
            }
            // console.log(event)
            res.send('Webhook received!');
        });
    }
    // Fungsi untuk membersihkan cache yang expired
    static cleanExpiredCache(currentTime) {
        for (const [key, timestamp] of WebhookController.processedMessages.entries()) {
            if (currentTime - timestamp > WebhookController.CACHE_DURATION) {
                WebhookController.processedMessages.delete(key);
            }
        }
    }
}
exports.WebhookController = WebhookController;
// Tambahkan cache untuk mencegah duplikasi
WebhookController.processedMessages = new Map();
WebhookController.CACHE_DURATION = 5 * 60 * 1000; // 5 menit
