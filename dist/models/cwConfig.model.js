"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatwootConfig = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const ChatwootConfigSchema = new mongoose_1.default.Schema({
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
});
exports.ChatwootConfig = mongoose_1.default.model('ChatwootConfig', ChatwootConfigSchema);
