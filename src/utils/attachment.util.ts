/**
 * Attachment Processing Utility Functions
 * Centralized attachment processing for WhatsApp and Chatwoot
 */

import axios from 'axios';
import { detectMimeTypeFromBuffer, getMimeTypeInfo, isValidMimeType } from './mime-type.util';
import { generateFileName, generateWhatsAppFileName, generateChatwootFileName } from './file-name.util';

export interface ProcessedAttachment {
  buffer: Buffer;
  filename: string;
  mimetype: string;
  category: 'image' | 'video' | 'audio' | 'document' | 'sticker';
  size: number;
  isValid: boolean;
  originalName?: string;
}

export interface AttachmentProcessingOptions {
  maxSize?: number;
  allowedTypes?: string[];
  generateTimestamp?: boolean;
  sanitizeFilename?: boolean;
  source?: 'whatsapp' | 'chatwoot';
}

/**
 * Download attachment from URL
 */
export async function downloadAttachmentFromUrl(
  url: string,
  options: AttachmentProcessingOptions = {}
): Promise<ProcessedAttachment> {
  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 30000,
      maxContentLength: options.maxSize || 50 * 1024 * 1024 // 50MB default
    });
    
    const buffer = Buffer.from(response.data);
    const detectedMimetype = detectMimeTypeFromBuffer(buffer);
    const mimetype = response.headers['content-type'] || detectedMimetype;
    
    return processAttachmentBuffer(buffer, mimetype, null, options);
  } catch (error) {
    throw new Error(`Failed to download attachment: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Process attachment buffer with metadata
 */
export function processAttachmentBuffer(
  buffer: Buffer,
  mimetype: string,
  originalName: string | null = null,
  options: AttachmentProcessingOptions = {}
): ProcessedAttachment {
  const {
    maxSize = 50 * 1024 * 1024, // 50MB
    allowedTypes,
    source = 'chatwoot'
  } = options;
  
  // Validate size
  const size = buffer.length;
  if (size > maxSize) {
    throw new Error(`File size ${size} exceeds maximum allowed size ${maxSize}`);
  }
  
  // Detect and validate MIME type
  const detectedMimetype = detectMimeTypeFromBuffer(buffer);
  const finalMimetype = mimetype || detectedMimetype;
  
  const isValid = isValidMimeType(finalMimetype, allowedTypes);
  if (!isValid && allowedTypes) {
    throw new Error(`MIME type ${finalMimetype} is not allowed`);
  }
  
  // Get MIME type info
  const mimeInfo = getMimeTypeInfo(finalMimetype);
  
  // Generate filename based on source
  let filename: string;
  if (source === 'whatsapp') {
    filename = generateWhatsAppFileName(finalMimetype);
  } else {
    filename = generateChatwootFileName(originalName, finalMimetype);
  }
  
  return {
    buffer,
    filename,
    mimetype: finalMimetype,
    category: mimeInfo.category,
    size,
    isValid,
    originalName: originalName || undefined  // Convert null to undefined
  };
}

/**
 * Process attachment for WhatsApp (from Chatwoot)
 */
export async function processAttachmentForWhatsApp(
  dataUrl: string,
  options: AttachmentProcessingOptions = {}
): Promise<ProcessedAttachment> {
  return downloadAttachmentFromUrl(dataUrl, {
    ...options,
    source: 'chatwoot'
  });
}

/**
 * Process attachment for Chatwoot (from WhatsApp)
 */
export function processAttachmentForChatwoot(
  buffer: Buffer,
  mimetype: string,
  originalName?: string,
  options: AttachmentProcessingOptions = {}
): ProcessedAttachment {
  return processAttachmentBuffer(buffer, mimetype, originalName, {
    ...options,
    source: 'whatsapp'
  });
}

/**
 * Validate attachment before processing
 */
export function validateAttachment(
  buffer: Buffer,
  mimetype: string,
  options: AttachmentProcessingOptions = {}
): { isValid: boolean; error?: string } {
  const { maxSize = 50 * 1024 * 1024, allowedTypes } = options;
  
  // Check size
  if (buffer.length > maxSize) {
    return {
      isValid: false,
      error: `File size ${buffer.length} exceeds maximum allowed size ${maxSize}`
    };
  }
  
  // Check MIME type
  if (!isValidMimeType(mimetype, allowedTypes)) {
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
export function getAttachmentCategory(mimetype: string): 'image' | 'video' | 'audio' | 'document' | 'sticker' {
  return getMimeTypeInfo(mimetype).category;
}

/**
 * Create standardized attachment data structure
 */
export function createAttachmentData(
  buffer: Buffer,
  filename: string,
  mimetype: string
): { buffer: Buffer; filename: string; mimetype: string } {
  return {
    buffer,
    filename,
    mimetype
  };
}