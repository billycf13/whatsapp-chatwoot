"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageService = void 0;
class MessageService {
    constructor(connection) {
        this.connection = connection;
    }
    sendText(jid, text) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.connection['sock'])
                throw new Error('Not Connected');
            return yield this.connection['sock'].sendMessage(jid, { text });
        });
    }
    sendImage(jid, buffer, caption) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.connection['sock'])
                throw new Error('Not Connected');
            return yield this.connection['sock'].sendMessage(jid, {
                image: buffer,
                caption
            });
        });
    }
    sendDocument(jid, buffer, fileName, mimetype) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.connection['sock'])
                throw new Error('Not Connected');
            return yield this.connection['sock'].sendMessage(jid, {
                document: buffer,
                fileName,
                mimetype
            });
        });
    }
    sendVideo(jid, buffer, caption) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.connection['sock'])
                throw new Error('Not Connected');
            return yield this.connection['sock'].sendMessage(jid, {
                video: buffer,
                caption
            });
        });
    }
    sendAudio(jid, buffer) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.connection['sock'])
                throw new Error('Not Connected');
            return yield this.connection['sock'].sendMessage(jid, {
                audio: buffer,
                mimetype: 'audio/ogg; codecs=opus'
            });
        });
    }
    readMessages(jid, messageKeys) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.connection['sock'])
                throw new Error('Not Connected');
            return yield this.connection['sock'].readMessages(messageKeys);
        });
    }
}
exports.MessageService = MessageService;
