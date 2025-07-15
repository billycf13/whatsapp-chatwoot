import { Request, Response } from 'express'
import { Session } from '../models/session.model'
import { ChatwootAppApi } from '../services/cw.appApi'
import { MessageService } from '../services/wa.message.serive'
import { ConnectionManager } from '../services/wa.connection.manager'
import { WhatsappController } from '../controllers/whatsapp.controller'
import axios from 'axios'
import * as path from 'path'

const chatwootAppApi = new ChatwootAppApi()
const whatsappController = new WhatsappController()

export class WebhookController {
    // Fungsi untuk mendeteksi MIME type dari buffer file
    private static detectMimeTypeFromBuffer(buffer: Buffer): string {
        // Deteksi berdasarkan magic bytes/file signature
        const header = buffer.toString('hex', 0, 10).toUpperCase()
        
        // Image formats
        if (header.startsWith('FFD8FF')) return 'image/jpeg'
        if (header.startsWith('89504E47')) return 'image/png'
        if (header.startsWith('47494638')) return 'image/gif'
        if (header.startsWith('52494646') && buffer.toString('ascii', 8, 12) === 'WEBP') return 'image/webp'
        if (header.startsWith('424D')) return 'image/bmp'
        
        // Document formats
        if (header.startsWith('25504446')) return 'application/pdf'
        if (header.startsWith('504B0304')) {
            // ZIP-based formats
            const content = buffer.toString('ascii', 0, 100)
            if (content.includes('word/')) return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            if (content.includes('xl/')) return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            if (content.includes('ppt/')) return 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
            return 'application/zip'
        }
        
        // Video formats
        if (header.startsWith('000000') && (header.includes('667479704D503420') || header.includes('6674797069736F6D'))) return 'video/mp4'
        if (header.startsWith('1A45DFA3')) return 'video/webm'
        if (header.startsWith('464C5601')) return 'video/x-flv'
        
        // Audio formats
        if (header.startsWith('494433') || header.startsWith('FFFB') || header.startsWith('FFF3')) return 'audio/mpeg'
        if (header.startsWith('4F676753')) return 'audio/ogg'
        if (header.startsWith('52494646') && buffer.toString('ascii', 8, 12) === 'WAVE') return 'audio/wav'
        if (header.startsWith('664C6143')) return 'audio/flac'
        
        // Text formats
        if (header.startsWith('EFBBBF') || buffer.toString('ascii', 0, 100).match(/^[\x20-\x7E\s]*$/)) return 'text/plain'
        
        return 'application/octet-stream' // Default fallback
    }
    
    // Fungsi untuk mendapatkan ekstensi file berdasarkan MIME type
    private static getFileExtension(mimeType: string, originalName?: string): string {
        // Cek jika file sudah memiliki ekstensi yang valid
        if (originalName && originalName.includes('.')) {
            const ext = path.extname(originalName).toLowerCase()
            const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.mp4', '.avi', '.mov', '.webm', '.flv', '.mp3', '.ogg', '.wav', '.flac', '.zip', '.rar']
            if (validExtensions.includes(ext)) {
                return originalName
            }
        }
        
        // Mapping MIME type ke ekstensi
        const mimeToExt: { [key: string]: string } = {
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
        }
        
        const extension = mimeToExt[mimeType] || '.bin'
        const baseName = originalName || `file_${Date.now()}`
        
        // Remove existing extension if any
        const nameWithoutExt = baseName.includes('.') ? baseName.substring(0, baseName.lastIndexOf('.')) : baseName
        
        return nameWithoutExt + extension
    }

    static async handleChatwootWebhook(req: Request, res: Response): Promise<void> {
        const sessionId = req.params.sessionId
        const event = req.body
        
        if (event.event === 'message_created' && event.sender.type === 'user' && event.message_type === 'outgoing') {
            const contact_id = Number(event.conversation.contact_inbox.contact_id)
            const showContact = await chatwootAppApi.showContact(contact_id)
            const identifier = showContact.payload.identifier
            const jid = identifier
            const message = event.content
            const contentType = event.content_type
            
            try {
                // Dapatkan koneksi WhatsApp
                const conn = await ConnectionManager.getConnection(sessionId)
                const msgService = new MessageService(conn)
                
                if (contentType === 'text' && message) {
                    // Kirim pesan text
                    console.log('Sending text:', sessionId, jid, message)
                    const sendText = await msgService.sendText(jid, message)
                    console.log('Text sent:', sendText)
                    
                } else if (event.attachments && event.attachments.length > 0) {
                    // Tangani pesan dengan attachment
                    console.log('Processing attachments:', event.attachments.length)
                    
                    for (const attachment of event.attachments) {
                        try {
                            // Download file dari Chatwoot
                            console.log('Downloading file from:', attachment.data_url)
                            const fileResponse = await axios.get(attachment.data_url, {
                                responseType: 'arraybuffer',
                                timeout: 30000
                            })
                            
                            const fileBuffer = Buffer.from(fileResponse.data)
                            
                            // Deteksi MIME type yang sebenarnya dari file buffer
                            let detectedMimeType = WebhookController.detectMimeTypeFromBuffer(fileBuffer)
                            let originalMimeType = attachment.file_type
                            
                            // Gunakan detected MIME type jika original adalah generik atau tidak valid
                            let finalMimeType = originalMimeType
                            if (originalMimeType === 'file' || 
                                originalMimeType === 'image' || 
                                originalMimeType === 'video' || 
                                originalMimeType === 'audio' || 
                                originalMimeType === 'document' || 
                                !originalMimeType || 
                                originalMimeType === 'application/octet-stream') {
                                finalMimeType = detectedMimeType
                                console.log(`MIME type detected: ${originalMimeType} -> ${detectedMimeType}`)
                            }
                            
                            // Generate filename dengan ekstensi yang tepat
                            const fileName = WebhookController.getFileExtension(finalMimeType, attachment.file_name)
                            
                            console.log('File info:', {
                                originalName: attachment.file_name,
                                finalName: fileName,
                                originalMime: originalMimeType,
                                detectedMime: detectedMimeType,
                                finalMime: finalMimeType,
                                size: fileBuffer.length
                            })
                            
                            // Tentukan jenis file dan kirim sesuai tipe
                            if (finalMimeType.startsWith('image/')) {
                                // Kirim sebagai gambar
                                const caption = message || fileName
                                console.log('Sending image:', fileName, 'to', jid)
                                const result = await msgService.sendImage(jid, fileBuffer, caption)
                                console.log('Image sent:', result)
                                
                            } else if (finalMimeType.startsWith('video/')) {
                                // Kirim sebagai video
                                const caption = message || fileName
                                console.log('Sending video:', fileName, 'to', jid)
                                const result = await msgService.sendVideo(jid, fileBuffer, caption)
                                console.log('Video sent:', result)
                                
                            } else if (finalMimeType.startsWith('audio/')) {
                                // Kirim sebagai audio
                                console.log('Sending audio:', fileName, 'to', jid)
                                const result = await msgService.sendAudio(jid, fileBuffer)
                                console.log('Audio sent:', result)
                                
                            } else {
                                // Kirim sebagai document
                                console.log('Sending document:', fileName, 'to', jid)
                                const result = await msgService.sendDocument(jid, fileBuffer, fileName, finalMimeType)
                                console.log('Document sent:', result)
                            }
                            
                        } catch (attachmentError) {
                            console.error('Error processing attachment:', attachment.file_name, attachmentError)
                            // Kirim pesan error sebagai text
                            await msgService.sendText(jid, `❌ Gagal mengirim file: ${attachment.file_name}`)
                        }
                    }
                    
                } else {
                    console.log('Unsupported content type or empty message:', contentType, message)
                    // Kirim pesan fallback
                    await msgService.sendText(jid, '❌ Jenis pesan tidak didukung')
                }
                
            } catch (error) {
                console.error('Error in webhook handler:', error)
            }
            
        } else if (event.event === 'message_updated') {
            console.log('Message updated event:', event)
        }
        
        res.send('Webhook received!')
    }
}