import mongoose from 'mongoose'

const MessageMappingSchema = new mongoose.Schema({
    sessionId: { type: String, required: true, index: true },
    whatsappMessageId: { type: String, required: true, index: true },
    chatwootMessageId: { type: String, required: true, index: true }, // pakai String biar aman
    conversationId: { type: Number, required: true, index: true },
    contactId: { type: Number, required: true },
    inboxId: { type: Number, required: true },
    messageType: { type: String, enum: ['incoming', 'outgoing'], required: true },
    waTimestamp: { type: Date, index: true }, // ganti nama timestamp biar jelas
    status: { type: String, enum: ['pending', 'sent', 'delivered', 'read', 'failed'], default: 'pending', index: true },
    externalSourceId: { type: String, index: true }, // kalau mau nyimpen stanzaId atau id lain
    additionalData: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true })

// Composite indexes for efficient querying
MessageMappingSchema.index({ sessionId: 1, whatsappMessageId: 1 }, { unique: true })
MessageMappingSchema.index({ sessionId: 1, chatwootMessageId: 1 })
MessageMappingSchema.index({ sessionId: 1, conversationId: 1, waTimestamp: -1 })

// Static methods for common operations
MessageMappingSchema.statics.findByWhatsAppId = function(sessionId: string, whatsappMessageId: string) {
    return this.findOne({ sessionId, whatsappMessageId })
}

MessageMappingSchema.statics.findByChatwootId = function(sessionId: string, chatwootMessageId: string) {
    return this.findOne({ sessionId, chatwootMessageId })
}

MessageMappingSchema.statics.findByConversation = function(sessionId: string, conversationId: number) {
    return this.find({ sessionId, conversationId }).sort({ waTimestamp: -1 })
}

MessageMappingSchema.statics.createMapping = function(data: any) {
    return this.create(data)
}

MessageMappingSchema.statics.updateStatus = function(sessionId: string, whatsappMessageId: string, status: string) {
    return this.findOneAndUpdate(
        { sessionId, whatsappMessageId },
        { status, updatedAt: new Date() },
        { new: true }
    )
}

export const MessageMapping = mongoose.model('MessageMapping', MessageMappingSchema)
