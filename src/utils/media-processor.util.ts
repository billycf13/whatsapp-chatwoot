/**
 * WhatsApp Media Processing Utility Functions
 * Specialized functions for WhatsApp media handling
 */

import { downloadMediaMessage } from '@whiskeysockets/baileys';
import { processAttachmentForChatwoot, ProcessedAttachment } from './attachment.util';

export interface WhatsAppMediaInfo {
  hasMedia: boolean;
  mediaType?: 'image' | 'video' | 'audio' | 'document' | 'sticker';
  mimetype?: string;
  filename?: string;
  caption?: string;
}

// ✅ Logger lengkap yang memenuhi interface ILogger
const simpleLogger = {
  level: 'info' as const,
  trace: (...args: any[]) => console.log('[TRACE]', ...args),
  debug: (...args: any[]) => console.log('[DEBUG]', ...args),
  info: (...args: any[]) => console.log('[INFO]', ...args),
  warn: (...args: any[]) => console.warn('[WARN]', ...args),
  error: (...args: any[]) => console.error('[ERROR]', ...args),
  fatal: (...args: any[]) => console.error('[FATAL]', ...args),
  child: (bindings: any) => simpleLogger // Return self for child logger
};

/**
 * Extract media information from WhatsApp message
 */
export function getWhatsAppMediaInfo(message: any): WhatsAppMediaInfo {
  // Validasi input message untuk menghindari error destructuring
  if (!message || typeof message !== 'object') {
    return { hasMedia: false };
  }

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
export async function processWhatsAppMedia(
  message: any,
  sock: any
): Promise<ProcessedAttachment | null> {
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
    const buffer = await downloadMediaMessage(message, 'buffer', {}, { 
      logger: simpleLogger,
      reuploadRequest: sock.updateMediaMessage
    }) as Buffer;
    
    if (!buffer) {
      throw new Error('Failed to download media from WhatsApp');
    }
    
    console.log('Media downloaded successfully:', {
      bufferSize: buffer.length
    });
    
    // Process attachment for Chatwoot
    return processAttachmentForChatwoot(
      buffer,
      mediaInfo.mimetype || 'application/octet-stream',
      mediaInfo.filename
    );
  } catch (error) {
    console.error('Error processing WhatsApp media:', error);
    throw error;
  }
}

/**
 * Check if WhatsApp message has media
 */
export function hasWhatsAppMedia(message: any): boolean {
  return getWhatsAppMediaInfo(message).hasMedia;
}

/**
 * Get WhatsApp media type
 */
export function getWhatsAppMediaType(message: any): string | null {
  const mediaInfo = getWhatsAppMediaInfo(message);
  return mediaInfo.hasMedia ? mediaInfo.mediaType || null : null;
}

/**
 * Extract caption from WhatsApp media message
 */
export function getWhatsAppMediaCaption(message: any): string | null {
  const mediaInfo = getWhatsAppMediaInfo(message);
  return mediaInfo.caption || null;
}