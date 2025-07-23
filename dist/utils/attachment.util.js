"use strict";
/**
 * Attachment Processing Utility Functions
 * Centralized attachment processing for WhatsApp and Chatwoot
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.downloadAttachmentFromUrl = downloadAttachmentFromUrl;
exports.processAttachmentBuffer = processAttachmentBuffer;
exports.processAttachmentForWhatsApp = processAttachmentForWhatsApp;
exports.processAttachmentForChatwoot = processAttachmentForChatwoot;
exports.validateAttachment = validateAttachment;
exports.getAttachmentCategory = getAttachmentCategory;
exports.createAttachmentData = createAttachmentData;
const axios_1 = __importDefault(require("axios"));
const mime_type_util_1 = require("./mime-type.util");
const file_name_util_1 = require("./file-name.util");
/**
 * Download attachment from URL
 */
function downloadAttachmentFromUrl(url_1) {
    return __awaiter(this, arguments, void 0, function* (url, options = {}) {
        try {
            const response = yield axios_1.default.get(url, {
                responseType: 'arraybuffer',
                timeout: 30000,
                maxContentLength: options.maxSize || 50 * 1024 * 1024 // 50MB default
            });
            const buffer = Buffer.from(response.data);
            const detectedMimetype = (0, mime_type_util_1.detectMimeTypeFromBuffer)(buffer);
            const mimetype = response.headers['content-type'] || detectedMimetype;
            return processAttachmentBuffer(buffer, mimetype, null, options);
        }
        catch (error) {
            throw new Error(`Failed to download attachment: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    });
}
/**
 * Process attachment buffer with metadata
 */
function processAttachmentBuffer(buffer, mimetype, originalName = null, options = {}) {
    const { maxSize = 50 * 1024 * 1024, // 50MB
    allowedTypes, source = 'chatwoot' } = options;
    // Validate size
    const size = buffer.length;
    if (size > maxSize) {
        throw new Error(`File size ${size} exceeds maximum allowed size ${maxSize}`);
    }
    // Detect and validate MIME type
    const detectedMimetype = (0, mime_type_util_1.detectMimeTypeFromBuffer)(buffer);
    const finalMimetype = mimetype || detectedMimetype;
    const isValid = (0, mime_type_util_1.isValidMimeType)(finalMimetype, allowedTypes);
    if (!isValid && allowedTypes) {
        throw new Error(`MIME type ${finalMimetype} is not allowed`);
    }
    // Get MIME type info
    const mimeInfo = (0, mime_type_util_1.getMimeTypeInfo)(finalMimetype);
    // Generate filename based on source
    let filename;
    if (source === 'whatsapp') {
        filename = (0, file_name_util_1.generateWhatsAppFileName)(finalMimetype);
    }
    else {
        filename = (0, file_name_util_1.generateChatwootFileName)(originalName, finalMimetype);
    }
    return {
        buffer,
        filename,
        mimetype: finalMimetype,
        category: mimeInfo.category,
        size,
        isValid,
        originalName: originalName || undefined // Convert null to undefined
    };
}
/**
 * Process attachment for WhatsApp (from Chatwoot)
 */
function processAttachmentForWhatsApp(dataUrl_1) {
    return __awaiter(this, arguments, void 0, function* (dataUrl, options = {}) {
        return downloadAttachmentFromUrl(dataUrl, Object.assign(Object.assign({}, options), { source: 'chatwoot' }));
    });
}
/**
 * Process attachment for Chatwoot (from WhatsApp)
 */
function processAttachmentForChatwoot(buffer, mimetype, originalName, options = {}) {
    return processAttachmentBuffer(buffer, mimetype, originalName, Object.assign(Object.assign({}, options), { source: 'whatsapp' }));
}
/**
 * Validate attachment before processing
 */
function validateAttachment(buffer, mimetype, options = {}) {
    const { maxSize = 50 * 1024 * 1024, allowedTypes } = options;
    // Check size
    if (buffer.length > maxSize) {
        return {
            isValid: false,
            error: `File size ${buffer.length} exceeds maximum allowed size ${maxSize}`
        };
    }
    // Check MIME type
    if (!(0, mime_type_util_1.isValidMimeType)(mimetype, allowedTypes)) {
        return {
            isValid: false,
            error: `MIME type ${mimetype} is not supported`
        };
    }
    return { isValid: true };
}
/**
 * Get attachment category for routing logic
 */
function getAttachmentCategory(mimetype) {
    return (0, mime_type_util_1.getMimeTypeInfo)(mimetype).category;
}
/**
 * Create standardized attachment data structure
 */
function createAttachmentData(buffer, filename, mimetype) {
    return {
        buffer,
        filename,
        mimetype
    };
}
