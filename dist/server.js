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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.wsClients = void 0;
const app_1 = __importDefault(require("./app"));
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const wa_connection_manager_1 = require("./services/wa.connection.manager");
const ws_1 = __importDefault(require("ws"));
dotenv_1.default.config();
const port = process.env.PORT || '';
const wssport = process.env.WSSPORT ? parseInt(process.env.WSSPORT) : 3081;
const mongodbUrl = process.env.MONGODB_URI || '';
const sessionDir = process.env.SESSION_DIR || '';
const wss = new ws_1.default.Server({ port: wssport });
const wsClients = {};
exports.wsClients = wsClients;
if (!mongodbUrl) {
    console.error('MONGODB_URI is not defined in the environment variables.');
    process.exit(1);
}
// MONGODB-CONFIGURATION
mongoose_1.default.connect(mongodbUrl)
    .then(() => {
    console.log('Connected to MongoDB');
})
    .catch((error) => {
    console.error('Error connecting to MongoDB:', error);
});
//WHATSAPP AUTO CONNECT
function autoConnectAllSessions() {
    return __awaiter(this, void 0, void 0, function* () {
        if (!fs_1.default.existsSync(sessionDir))
            return;
        const sessionIds = fs_1.default.readdirSync(sessionDir).filter(name => {
            const sessionPath = path_1.default.join(sessionDir, name);
            return fs_1.default.statSync(sessionPath).isDirectory();
        });
        for (const sessionId of sessionIds) {
            const sessionPath = path_1.default.join(sessionDir, sessionId);
            const credsPath = path_1.default.join(sessionPath, 'creds.json');
            const files = fs_1.default.readdirSync(sessionPath);
            if (files.length === 0 || (files.length === 1 && files[0] === 'creds.json')) {
                fs_1.default.rmSync(sessionPath, { recursive: true, force: true });
                console.log(`Incomplete session ${sessionId} deleted`);
                continue;
            }
            if (!fs_1.default.existsSync(credsPath)) {
                fs_1.default.rmSync(sessionPath, { recursive: true, force: true });
                console.log(`Incomplete session ${sessionId} without creds deleted`);
                continue;
            }
            try {
                console.log(`Auto connecting session ${sessionId}`);
                yield wa_connection_manager_1.ConnectionManager.getConnection(sessionId);
                console.log(`Auto connected session ${sessionId}`);
            }
            catch (error) {
                console.error(`Error auto connecting session ${sessionId}:`, error);
                fs_1.default.rmSync(sessionPath, { recursive: true, force: true });
                console.log(`Incomplete session ${sessionId} deleted`);
            }
        }
    });
}
autoConnectAllSessions();
//WEBSOCKET
wss.on('connection', (ws, req) => {
    ws.on('message', (msg) => {
        try {
            const { sessionId } = JSON.parse(msg.toString());
            wsClients[sessionId] = ws;
            ws.send(JSON.stringify({ status: 'connected' }));
        }
        catch (_a) { }
    });
    ws.on('close', () => {
        Object.keys(wsClients).forEach(sessionId => {
            if (wsClients[sessionId] === ws) {
                delete wsClients[sessionId];
            }
        });
    });
});
app_1.default.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
