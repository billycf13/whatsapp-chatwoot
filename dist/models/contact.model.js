"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Contact = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const ContactSchema = new mongoose_1.default.Schema({
    sessionId: {
        type: String,
        required: true,
        ref: 'Session',
        index: true
    },
    identifier: {
        type: String,
        required: true,
    },
    phone_number: {
        type: String,
        required: true,
        validate: {
            validator: function (v) {
                return /^\[0-9]\d{1,14}$/.test(v);
            },
            message: (props) => `${props.value} is not a valid phone number!}`
        }
    },
    name: String,
    source_id: String,
    conversation_id: Number,
}, {
    timestamps: true
});
ContactSchema.index({ sessionId: 1, identifier: 1 }, { unique: true });
exports.Contact = mongoose_1.default.model('Contact', ContactSchema);
