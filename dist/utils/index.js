"use strict";
/**
 * Attachment Processing Utilities
 * Centralized export for all attachment-related utilities
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWhatsAppMediaCaption = exports.getWhatsAppMediaType = exports.hasWhatsAppMedia = exports.processWhatsAppMedia = exports.getWhatsAppMediaInfo = exports.createAttachmentData = exports.getAttachmentCategory = exports.validateAttachment = exports.processAttachmentForChatwoot = exports.processAttachmentForWhatsApp = exports.processAttachmentBuffer = exports.downloadAttachmentFromUrl = exports.isValidFileName = exports.generateChatwootFileName = exports.generateWhatsAppFileName = exports.sanitizeFileName = exports.generateFileName = exports.getMimeTypeInfo = exports.isValidMimeType = exports.getMimeTypeCategory = exports.getFileExtension = exports.detectMimeTypeFromBuffer = void 0;
// MIME Type utilities
var mime_type_util_1 = require("./mime-type.util");
Object.defineProperty(exports, "detectMimeTypeFromBuffer", { enumerable: true, get: function () { return mime_type_util_1.detectMimeTypeFromBuffer; } });
Object.defineProperty(exports, "getFileExtension", { enumerable: true, get: function () { return mime_type_util_1.getFileExtension; } });
Object.defineProperty(exports, "getMimeTypeCategory", { enumerable: true, get: function () { return mime_type_util_1.getMimeTypeCategory; } });
Object.defineProperty(exports, "isValidMimeType", { enumerable: true, get: function () { return mime_type_util_1.isValidMimeType; } });
Object.defineProperty(exports, "getMimeTypeInfo", { enumerable: true, get: function () { return mime_type_util_1.getMimeTypeInfo; } });
// Filename utilities
var file_name_util_1 = require("./file-name.util");
Object.defineProperty(exports, "generateFileName", { enumerable: true, get: function () { return file_name_util_1.generateFileName; } });
Object.defineProperty(exports, "sanitizeFileName", { enumerable: true, get: function () { return file_name_util_1.sanitizeFileName; } });
Object.defineProperty(exports, "generateWhatsAppFileName", { enumerable: true, get: function () { return file_name_util_1.generateWhatsAppFileName; } });
Object.defineProperty(exports, "generateChatwootFileName", { enumerable: true, get: function () { return file_name_util_1.generateChatwootFileName; } });
Object.defineProperty(exports, "isValidFileName", { enumerable: true, get: function () { return file_name_util_1.isValidFileName; } });
// Attachment processing utilities
var attachment_util_1 = require("./attachment.util");
Object.defineProperty(exports, "downloadAttachmentFromUrl", { enumerable: true, get: function () { return attachment_util_1.downloadAttachmentFromUrl; } });
Object.defineProperty(exports, "processAttachmentBuffer", { enumerable: true, get: function () { return attachment_util_1.processAttachmentBuffer; } });
Object.defineProperty(exports, "processAttachmentForWhatsApp", { enumerable: true, get: function () { return attachment_util_1.processAttachmentForWhatsApp; } });
Object.defineProperty(exports, "processAttachmentForChatwoot", { enumerable: true, get: function () { return attachment_util_1.processAttachmentForChatwoot; } });
Object.defineProperty(exports, "validateAttachment", { enumerable: true, get: function () { return attachment_util_1.validateAttachment; } });
Object.defineProperty(exports, "getAttachmentCategory", { enumerable: true, get: function () { return attachment_util_1.getAttachmentCategory; } });
Object.defineProperty(exports, "createAttachmentData", { enumerable: true, get: function () { return attachment_util_1.createAttachmentData; } });
// WhatsApp media processing utilities
var media_processor_util_1 = require("./media-processor.util");
Object.defineProperty(exports, "getWhatsAppMediaInfo", { enumerable: true, get: function () { return media_processor_util_1.getWhatsAppMediaInfo; } });
Object.defineProperty(exports, "processWhatsAppMedia", { enumerable: true, get: function () { return media_processor_util_1.processWhatsAppMedia; } });
Object.defineProperty(exports, "hasWhatsAppMedia", { enumerable: true, get: function () { return media_processor_util_1.hasWhatsAppMedia; } });
Object.defineProperty(exports, "getWhatsAppMediaType", { enumerable: true, get: function () { return media_processor_util_1.getWhatsAppMediaType; } });
Object.defineProperty(exports, "getWhatsAppMediaCaption", { enumerable: true, get: function () { return media_processor_util_1.getWhatsAppMediaCaption; } });
