"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Session = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const sessionSchema = new mongoose_1.default.Schema({
    sessionId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    phoneNumber: {
        type: String,
        sparse: true,
        index: true
    },
    name: String,
}, {
    timestamps: true
});
sessionSchema.pre('save', function (next) {
    if (!this.isNew && this.isModified('sessionId')) {
        next(new Error('sessionId cannot be modified'));
    }
    next();
});
exports.Session = mongoose_1.default.model('Session', sessionSchema);
