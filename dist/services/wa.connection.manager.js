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
exports.ConnectionManager = void 0;
const baileys_service_1 = require("./baileys.service");
class ConnectionManager {
    static getConnection(sessionId, usePairingCode, phoneNumber) {
        return __awaiter(this, void 0, void 0, function* () {
            let conn = this.instance.get(sessionId);
            if (!conn) {
                conn = new baileys_service_1.BaileysConnection(sessionId, usePairingCode, phoneNumber);
                yield conn.connect();
                this.instance.set(sessionId, conn);
            }
            return conn;
        });
    }
    static logout(sessionId) {
        return __awaiter(this, void 0, void 0, function* () {
            const conn = this.instance.get(sessionId);
            if (conn && conn['sock']) {
                yield conn['sock'].logout();
                this.instance.delete(sessionId);
            }
        });
    }
    static updateSessionId(oldSessionId, newSessionId, conn) {
        if (this.instance.has(oldSessionId)) {
            this.instance.delete(oldSessionId);
            this.instance.set(newSessionId, conn);
        }
    }
}
exports.ConnectionManager = ConnectionManager;
ConnectionManager.instance = new Map();
