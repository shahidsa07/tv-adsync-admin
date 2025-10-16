"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("http");
const ws_1 = require("ws");
const chokidar_1 = __importDefault(require("chokidar"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
// Note: This server does not have access to the main app's Firebase Admin SDK instance.
// It relies on a file-based notification system to receive commands.
const hostname = '0.0.0.0'; // Listen on all network interfaces
const port = process.env.SOCKET_PORT ? parseInt(process.env.SOCKET_PORT, 10) : 8081;
const server = (0, http_1.createServer)((req, res) => {
    // This is a dedicated WebSocket server. It does not serve HTTP content.
    // Respond with a 404 for any standard HTTP requests.
    if (req.url === '/health' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok' }));
    }
    else {
        res.writeHead(404);
        res.end();
    }
});
const wss = new ws_1.WebSocketServer({ server });
const tvConnections = new Map();
const adminConnections = new Set();
const NOTIFICATION_DIR = path.join(process.cwd(), '.notifications');
const broadcastToAdmins = (message) => {
    const messageString = JSON.stringify(message);
    adminConnections.forEach(ws => {
        if (ws.readyState === ws.OPEN) {
            ws.send(messageString);
        }
    });
};
const setupNotificationWatcher = async () => {
    try {
        if (!fs.existsSync(NOTIFICATION_DIR)) {
            await fs.promises.mkdir(NOTIFICATION_DIR, { recursive: true });
        }
        console.log(`[Socket Server] Watching for notifications in: ${NOTIFICATION_DIR}`);
        const watcher = chokidar_1.default.watch(NOTIFICATION_DIR, {
            ignored: /^\./,
            persistent: true,
            ignoreInitial: true,
        });
        watcher.on('add', async (filePath) => {
            try {
                const content = await fs.promises.readFile(filePath, 'utf-8');
                const notification = JSON.parse(content);
                console.log('[Socket Server] Processing notification:', notification);
                if (notification.type === 'tv') {
                    await sendRefreshToTv(notification.id);
                }
                else if (notification.type === 'group') {
                    // This standalone server doesn't know about groups. 
                    // The main app must notify each TV individually.
                    // However, we'll leave this here in case we want to expand functionality later.
                    console.log(`[Socket Server] Group notification received for ${notification.id}, but this server cannot resolve TVs in a group. The main app is responsible for notifying individual TVs.`);
                }
                else if (notification.type === 'status-change') {
                    broadcastToAdmins({ type: 'status-changed', payload: notification.payload });
                }
                await fs.promises.unlink(filePath);
            }
            catch (error) {
                console.error(`[Socket Server] Error processing notification file ${filePath}:`, error);
            }
        });
    }
    catch (error) {
        console.error('[Socket Server] Error setting up notification watcher:', error);
    }
};
const sendRefreshToTv = async (tvId) => {
    const ws = tvConnections.get(tvId);
    if (ws && ws.readyState === ws.OPEN) {
        console.log(`[Socket Server] Sending REFRESH_STATE to ${tvId}`);
        ws.send(JSON.stringify({ type: 'REFRESH_STATE' }));
    }
    else {
        console.log(`[Socket Server] No active connection for TV ${tvId} to send refresh.`);
    }
};
wss.on('connection', (ws) => {
    let clientId = null;
    let clientType = null;
    console.log('[Socket Server] A client connected.');
    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message.toString());
            if (data.type === 'register' && data.payload) {
                const { tvId, clientType: type } = data.payload;
                if (type === 'admin') {
                    clientType = 'admin';
                    adminConnections.add(ws);
                    console.log('[Socket Server] Admin client registered.');
                    ws.send(JSON.stringify({ type: 'registered', clientType: 'admin' }));
                    return;
                }
                if (tvId) {
                    clientType = 'tv';
                    clientId = tvId;
                    if (tvConnections.has(clientId)) {
                        console.log(`[Socket Server] Terminating old connection for ${clientId}`);
                        tvConnections.get(clientId)?.terminate();
                    }
                    tvConnections.set(clientId, ws);
                    console.log(`[Socket Server] TV registered: ${clientId}`);
                    ws.send(JSON.stringify({ type: 'registered', tvId: clientId }));
                    // Notify main app that TV is online
                    await fs.promises.writeFile(path.join(NOTIFICATION_DIR, `status-${clientId}-on.json`), JSON.stringify({
                        type: 'status-change',
                        payload: { tvId: clientId, isOnline: true }
                    }));
                }
            }
            else {
                console.log('[Socket Server] Received unknown message type:', data.type);
            }
        }
        catch (error) {
            console.error(`[Socket Server] Failed to process message: ${message.toString()}`, error);
        }
    });
    ws.on('close', async () => {
        if (clientType === 'admin') {
            adminConnections.delete(ws);
            console.log('[Socket Server] Admin client disconnected.');
        }
        else if (clientType === 'tv' && clientId) {
            const currentClientId = clientId;
            if (tvConnections.get(currentClientId) === ws) {
                tvConnections.delete(currentClientId);
                console.log(`[Socket Server] TV disconnected: ${currentClientId}`);
                // Notify main app that TV is offline
                await fs.promises.writeFile(path.join(NOTIFICATION_DIR, `status-${currentClientId}-off.json`), JSON.stringify({
                    type: 'status-change',
                    payload: { tvId: currentClientId, isOnline: false }
                }));
            }
        }
    });
    ws.on('error', (error) => {
        console.error('[Socket Server] WebSocket error:', error);
    });
});
setupNotificationWatcher();
server.listen(port, hostname, () => {
    console.log(`> WebSocket server listening at http://${hostname}:${port}`);
});
