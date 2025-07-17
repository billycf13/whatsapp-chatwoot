/**
 * Filename Utility Functions
 * Centralized filename generation and validation
 */

import { getFileExtension } from './mime-type.util';

export interface FileNameOptions {
  prefix?: string;
  suffix?: string;
  includeTimestamp?: boolean;
  sanitize?: boolean;
  maxLength?: number;
}

/**
 * Generate a filename with various options
 */
export function generateFileName(
  originalName: string | null,
  mimetype: string,
  options: FileNameOptions = {}
): string {
  const {
    prefix = '',
    suffix = '',
    includeTimestamp = true,
    sanitize = true,
    maxLength = 100
  } = options;
  
  let filename = originalName || 'attachment';
  
  // Remove extension from original name
  const lastDotIndex = filename.lastIndexOf('.');
  if (lastDotIndex > 0) {
    filename = filename.substring(0, lastDotIndex);
  }
  
  // Sanitize filename
  if (sanitize) {
    filename = sanitizeFileName(filename);
  }
  
  // Add prefix and suffix
  if (prefix) filename = `${prefix}_${filename}`;
  if (suffix) filename = `${filename}_${suffix}`;
  
  // Add timestamp
  if (includeTimestamp) {
    const timestamp = Date.now();
    filename = `${filename}_${timestamp}`;
  }
  
  // Get proper extension
  const extension = getFileExtension(mimetype);
  
  // Combine and limit length
  let fullFilename = `${filename}.${extension}`;
  if (fullFilename.length > maxLength) {
    const availableLength = maxLength - extension.length - 1; // -1 for dot
    filename = filename.substring(0, availableLength);
    fullFilename = `${filename}.${extension}`;
  }
  
  return fullFilename;
}

/**
 * Sanitize filename by removing illegal characters
 */
export function sanitizeFileName(filename: string): string {
  // Remove illegal characters for most filesystems
  return filename
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/[\x00-\x1f\x80-\x9f]/g, '_')
    .replace(/^\.|\.$/, '_')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .trim();
}

/**
 * Generate WhatsApp media filename
 */
export function generateWhatsAppFileName(mimetype: string, messageId?: string): string {
  const category = mimetype.startsWith('image/') ? 'IMG' :
                  mimetype.startsWith('video/') ? 'VID' :
                  mimetype.startsWith('audio/') ? 'AUD' : 'DOC';
  
  const timestamp = Date.now();
  const id = messageId ? messageId.substring(0, 8) : Math.random().toString(36).substring(2, 8);
  const extension = getFileExtension(mimetype);
  
  return `WA_${category}_${timestamp}_${id}.${extension}`;
}

/**
 * Generate Chatwoot attachment filename
 */
export function generateChatwootFileName(originalName: string | null, mimetype: string): string {
  return generateFileName(originalName, mimetype, {
    prefix: 'CW',
    includeTimestamp: true,
    sanitize: true
  });
}

/**
 * Validate filename
 */
export function isValidFileName(filename: string): boolean {
  if (!filename || filename.length === 0) return false;
  if (filename.length > 255) return false;
  
  // Check for illegal characters
  const illegalChars = /[<>:"/\\|?*\x00-\x1f\x80-\x9f]/;
  if (illegalChars.test(filename)) return false;
  
  // Check for reserved names (Windows)
  const reservedNames = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i;
  const nameWithoutExt = filename.replace(/\.[^.]*$/, '');
  if (reservedNames.test(nameWithoutExt)) return false;
  
  return true;
}