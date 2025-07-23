"use strict";
/**
 * WhatsApp Media Processing Utility Functions
 * Specialized functions for WhatsApp media handling
 */
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
exports.getWhatsAppMediaInfo = getWhatsAppMediaInfo;
exports.processWhatsAppMedia = processWhatsAppMedia;
exports.hasWhatsAppMedia = hasWhatsAppMedia;
exports.getWhatsAppMediaType = getWhatsAppMediaType;
exports.getWhatsAppMediaCaption = getWhatsAppMediaCaption;
const baileys_1 = require("@whiskeysockets/baileys");
const attachment_util_1 = require("./attachment.util");
// ✅ Logger lengkap yang memenuhi interface ILogger
const simpleLogger = {
    level: 'info',
    trace: (...args) => console.log('[TRACE]', ...args),
    debug: (...args) => console.log('[DEBUG]', ...args),
    info: (...args) => console.log('[INFO]', ...args),
    warn: (...args) => console.warn('[WARN]', ...args),
    error: (...args) => console.error('[ERROR]', ...args),
    fatal: (...args) => console.error('[FATAL]', ...args),
    child: (bindings) => simpleLogger // Return self for child logger
};
/**
 * Extract media information from WhatsApp message
 */
function getWhatsAppMediaInfo(message) {
    const { imageMessage, videoMessage, audioMessage, documentMessage, stickerMessage } = message;
    if (imageMessage) {
        return {
            hasMedia: true,
            mediaType: 'image',
            mimetype: imageMessage.mimetype,
            caption: imageMessage.caption
        };
    }
    if (videoMessage) {
        return {
            hasMedia: true,
            mediaType: 'video',
            mimetype: videoMessage.mimetype,
            caption: videoMessage.caption
        };
    }
    if (audioMessage) {
        return {
            hasMedia: true,
            mediaType: 'audio',
            mimetype: audioMessage.mimetype
        };
    }
    if (documentMessage) {
        return {
            hasMedia: true,
            mediaType: 'document',
            mimetype: documentMessage.mimetype,
            filename: documentMessage.fileName
        };
    }
    if (stickerMessage) {
        return {
            hasMedia: true,
            mediaType: 'sticker',
            mimetype: stickerMessage.mimetype
        };
    }
    return { hasMedia: false };
}
/**
 * Process WhatsApp media message
 */
function processWhatsAppMedia(message, sock) {
    return __awaiter(this, void 0, void 0, function* () {
        const mediaInfo = getWhatsAppMediaInfo(message.message);
        if (!mediaInfo.hasMedia) {
            return null;
        }
        // Validasi socket tersedia
        if (!sock) {
            throw new Error('Socket connection is required for downloading media');
        }
        try {
            console.log('Downloading media with socket...', {
                mediaType: mediaInfo.mediaType,
                mimetype: mediaInfo.mimetype
            });
            // ✅ Gunakan logger yang sudah lengkap
            const buffer = yield (0, baileys_1.downloadMediaMessage)(message, 'buffer', {}, {
                logger: simpleLogger,
                reuploadRequest: sock.updateMediaMessage
            });
            if (!buffer) {
                throw new Error('Failed to download media from WhatsApp');
            }
            console.log('Media downloaded successfully:', {
                bufferSize: buffer.length
            });
            // Process attachment for Chatwoot
            return (0, attachment_util_1.processAttachmentForChatwoot)(buffer, mediaInfo.mimetype || 'application/octet-stream', mediaInfo.filename);
        }
        catch (error) {
            console.error('Error processing WhatsApp media:', error);
            throw error;
        }
    });
}
/**
 * Check if WhatsApp message has media
 */
function hasWhatsAppMedia(message) {
    return getWhatsAppMediaInfo(message).hasMedia;
}
/**
 * Get WhatsApp media type
 */
function getWhatsAppMediaType(message) {
    const mediaInfo = getWhatsAppMediaInfo(message);
    return mediaInfo.hasMedia ? mediaInfo.mediaType || null : null;
}
/**
 * Extract caption from WhatsApp media message
 */
function getWhatsAppMediaCaption(message) {
    const mediaInfo = getWhatsAppMediaInfo(message);
    return mediaInfo.caption || null;
}
