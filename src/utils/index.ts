/**
 * Attachment Processing Utilities
 * Centralized export for all attachment-related utilities
 */

// MIME Type utilities
export {
  detectMimeTypeFromBuffer,
  getFileExtension,
  getMimeTypeCategory,
  isValidMimeType,
  getMimeTypeInfo,
  type MimeTypeInfo
} from './mime-type.util';

// Filename utilities
export {
  generateFileName,
  sanitizeFileName,
  generateWhatsAppFileName,
  generateChatwootFileName,
  isValidFileName,
  type FileNameOptions
} from './file-name.util';

// Attachment processing utilities
export {
  downloadAttachmentFromUrl,
  processAttachmentBuffer,
  processAttachmentForWhatsApp,
  processAttachmentForChatwoot,
  validateAttachment,
  getAttachmentCategory,
  createAttachmentData,
  type ProcessedAttachment,
  type AttachmentProcessingOptions
} from './attachment.util';

// WhatsApp media processing utilities
export {
  getWhatsAppMediaInfo,
  processWhatsAppMedia,
  hasWhatsAppMedia,
  getWhatsAppMediaType,
  getWhatsAppMediaCaption,
  type WhatsAppMediaInfo
} from './media-processor.util';