import mongoose from 'mongoose'

const ChatwootConfigSchema = new mongoose.Schema({
    sessionId: {
        type: String,
        required: true,
        // Hapus baris ref: 'Session',
        index: true
    },
    baseUrl: {
        type: String,
        required: true,
    },
    agentApiToken: {
        type: String,
        required: true,
    },
    botApiToken: {
        type: String,
        required: true,
    },
    inboxIdentifier: {
        type: String,
        required: true,
    },
    accountId: {
        type: String,
        required: true,
    }
}, {
        timestamps: true
    })

export const ChatwootConfig = mongoose.model('ChatwootConfig', ChatwootConfigSchema)