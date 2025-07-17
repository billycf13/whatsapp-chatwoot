/**
 * MIME Type Utility Functions
 * Centralized MIME type detection and file extension mapping
 */

export interface MimeTypeInfo {
  mimetype: string;
  extension: string;
  category: 'image' | 'video' | 'audio' | 'document' | 'sticker';
}

/**
 * Detect MIME type from buffer by examining file signatures
 */
export function detectMimeTypeFromBuffer(buffer: Buffer): string {
  if (buffer.length < 4) return 'application/octet-stream';

  const header = buffer.subarray(0, 12);
  
  // Image formats
  if (header[0] === 0xFF && header[1] === 0xD8 && header[2] === 0xFF) {
    return 'image/jpeg';
  }
  if (header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4E && header[3] === 0x47) {
    return 'image/png';
  }
  if (header[0] === 0x47 && header[1] === 0x49 && header[2] === 0x46) {
    return 'image/gif';
  }
  if (header.subarray(0, 4).toString() === 'RIFF' && header.subarray(8, 12).toString() === 'WEBP') {
    return 'image/webp';
  }
  
  // Video formats
  if (header.subarray(4, 8).toString() === 'ftyp') {
    return 'video/mp4';
  }
  if (header[0] === 0x1A && header[1] === 0x45 && header[2] === 0xDF && header[3] === 0xA3) {
    return 'video/webm';
  }
  
  // Audio formats
  if (header[0] === 0xFF && (header[1] & 0xE0) === 0xE0) {
    return 'audio/mpeg';
  }
  if (header.subarray(0, 4).toString() === 'OggS') {
    return 'audio/ogg';
  }
  if (header.subarray(0, 4).toString() === 'RIFF' && header.subarray(8, 12).toString() === 'WAVE') {
    return 'audio/wav';
  }
  
  // Document formats
  if (header.subarray(0, 4).toString() === '%PDF') {
    return 'application/pdf';
  }
  if (header[0] === 0x50 && header[1] === 0x4B && (header[2] === 0x03 || header[2] === 0x05)) {
    // Check for specific Office formats
    const bufferStr = buffer.toString('ascii', 0, Math.min(buffer.length, 100));
    if (bufferStr.includes('word/')) return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    if (bufferStr.includes('xl/')) return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    if (bufferStr.includes('ppt/')) return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
    return 'application/zip';
  }
  
  return 'application/octet-stream';
}

/**
 * Get file extension from MIME type
 */
export function getFileExtension(mimetype: string): string {
  const mimeToExt: Record<string, string> = {
    // Images
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/svg+xml': 'svg',
    'image/bmp': 'bmp',
    'image/tiff': 'tiff',
    
    // Videos
    'video/mp4': 'mp4',
    'video/mpeg': 'mpeg',
    'video/quicktime': 'mov',
    'video/x-msvideo': 'avi',
    'video/webm': 'webm',
    'video/3gpp': '3gp',
    
    // Audio
    'audio/mpeg': 'mp3',
    'audio/mp3': 'mp3',
    'audio/wav': 'wav',
    'audio/ogg': 'ogg',
    'audio/aac': 'aac',
    'audio/x-m4a': 'm4a',
    'audio/amr': 'amr',
    
    // Documents
    'application/pdf': 'pdf',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'application/vnd.ms-excel': 'xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
    'application/vnd.ms-powerpoint': 'ppt',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
    'text/plain': 'txt',
    'text/csv': 'csv',
    'application/zip': 'zip',
    'application/x-rar-compressed': 'rar',
    
    // Default
    'application/octet-stream': 'bin'
  };
  
  return mimeToExt[mimetype] || 'bin';
}

/**
 * Get MIME type category for processing logic
 */
export function getMimeTypeCategory(mimetype: string): 'image' | 'video' | 'audio' | 'document' | 'sticker' {
  if (mimetype.startsWith('image/')) {
    return mimetype === 'image/webp' ? 'sticker' : 'image';
  }
  if (mimetype.startsWith('video/')) return 'video';
  if (mimetype.startsWith('audio/')) return 'audio';
  return 'document';
}

/**
 * Validate if MIME type is supported
 */
export function isValidMimeType(mimetype: string, allowedTypes?: string[]): boolean {
  if (allowedTypes) {
    return allowedTypes.includes(mimetype);
  }
  
  const supportedTypes = [
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
  ];
  
  return supportedTypes.includes(mimetype);
}

/**
 * Get complete MIME type information
 */
export function getMimeTypeInfo(mimetype: string): MimeTypeInfo {
  return {
    mimetype,
    extension: getFileExtension(mimetype),
    category: getMimeTypeCategory(mimetype)
  };
}