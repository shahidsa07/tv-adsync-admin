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
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)(); // Load environment variables from .env file
const ws_1 = require("ws");
const http_1 = require("http");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const data_1 = require("./lib/data");
const chokidar_1 = __importDefault(require("chokidar"));
// App Hosting will provide the PORT environment variable.
const PORT = parseInt(process.env.PORT || '8080', 10);
const HOST = '0.0.0.0'; // Listen on all available network interfaces
const isProduction = process.env.NODE_ENV === 'production';
let server;
if (isProduction) {
    console.log('Starting WebSocket server in PRODUCTION mode (ws://)');
    // In production, we run behind a proxy that handles TLS, so we use a standard HTTP server.
    // The public-facing protocol will be wss://.
    server = (0, http_1.createServer)();
}
else {
    console.log('Starting WebSocket server in DEVELOPMENT mode (ws://)');
    // In development, create a standard HTTP server
    server = (0, http_1.createServer)();
}
const wss = new ws_1.WebSocketServer({ noServer: true });
// Handle the HTTP upgrade request to switch to WebSocket protocol
server.on('upgrade', (request, socket, head) => {
    // Here we can add authentication or validation logic if needed
    wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
    });
});
// Separate maps for different client types
const tvConnections = new Map();
const adminConnections = new Set();
const NOTIFICATION_DIR = path.join(process.cwd(), '.notifications');
// Function to broadcast messages to all admin clients
const broadcastToAdmins = (message) => {
    const messageString = JSON.stringify(message);
    adminConnections.forEach(ws => {
        if (ws.readyState === ws_1.WebSocket.OPEN) {
            ws.send(messageString);
        }
    });
};
const setupNotificationWatcher = async () => {
    try {
        await fs.promises.mkdir(NOTIFICATION_DIR, { recursive: true });
        console.log(`Watching for notifications in: ${NOTIFICATION_DIR}`);
        const watcher = chokidar_1.default.watch(NOTIFICATION_DIR, {
            ignored: /^\./,
            persistent: true,
            ignoreInitial: true,
        });
        watcher.on('add', async (filePath) => {
            try {
                const content = await fs.promises.readFile(filePath, 'utf-8');
                const notification = JSON.parse(content);
                console.log('Processing notification:', notification);
                if (notification.type === 'tv') {
                    await sendRefreshToTv(notification.id);
                }
                else if (notification.type === 'group') {
                    const tvs = await (0, data_1.getTvsByGroupId)(notification.id);
                    tvs.forEach(tv => sendRefreshToTv(tv.tvId));
                }
                // Clean up the notification file
                await fs.promises.unlink(filePath);
            }
            catch (error) {
                console.error(`Error processing notification file ${filePath}:`, error);
            }
        });
    }
    catch (error) {
        console.error('Error setting up notification watcher:', error);
    }
};
const sendRefreshToTv = async (tvId) => {
    const ws = tvConnections.get(tvId);
    if (ws && ws.readyState === ws_1.WebSocket.OPEN) {
        const tvDoc = await (0, data_1.getTvById)(tvId);
        // If the TV is registered, update its online status and tell it to refresh
        if (tvDoc) {
            // Mark as online
            if (tvDoc.socketId === null) {
                console.log(`TV ${tvId} is now registered and connected, marking as online.`);
                await handleTvConnection(tvId, true, ws);
            }
            console.log(`Sending REFRESH_STATE to ${tvId}`);
            ws.send(JSON.stringify({ type: 'REFRESH_STATE' }));
        }
        else {
            console.log(`Received notification for unregistered TV ${tvId}, skipping.`);
        }
    }
    else {
        console.log(`No active connection found for TV ${tvId} to send refresh.`);
    }
};
const handleTvConnection = async (tvId, isConnecting, ws) => {
    const socketId = isConnecting ? `ws-${Date.now()}` : null;
    try {
        await (0, data_1.setTvOnlineStatus)(tvId, isConnecting, socketId);
        broadcastToAdmins({ type: 'status-changed', payload: { tvId, isOnline: isConnecting } });
    }
    catch (error) {
        console.error(`Error updating TV status for ${tvId}:`, error);
    }
};
wss.on('connection', (ws) => {
    let clientId = null;
    let clientType = null;
    ws.on('message', async (message) => {
        var _a;
        try {
            const data = JSON.parse(message.toString());
            if (data.type === 'register' && data.payload) {
                const { tvId, clientType: type } = data.payload;
                if (type === 'admin') {
                    clientType = 'admin';
                    adminConnections.add(ws);
                    console.log('Admin client connected');
                    ws.send(JSON.stringify({ type: 'registered', clientType: 'admin' }));
                    return;
                }
                if (tvId) {
                    clientType = 'tv';
                    clientId = tvId;
                    if (tvConnections.has(clientId)) {
                        console.log(`Terminating old connection for ${clientId}`);
                        (_a = tvConnections.get(clientId)) === null || _a === void 0 ? void 0 : _a.terminate();
                    }
                    tvConnections.set(clientId, ws);
                    console.log(`TV connection opened: ${clientId}`);
                    const tvDoc = await (0, data_1.getTvById)(clientId);
                    if (tvDoc) {
                        await handleTvConnection(clientId, true, ws);
                    }
                    else {
                        console.log(`TV is not registered yet. Connection is pending registration for: ${clientId}`);
                    }
                    ws.send(JSON.stringify({ type: 'registered', tvId: clientId }));
                }
            }
            else {
                console.log('Received unknown message type:', data.type);
            }
        }
        catch (error) {
            console.error(`Failed to process message: ${message.toString()}`, error);
        }
    });
    ws.on('close', async () => {
        if (clientType === 'admin') {
            adminConnections.delete(ws);
            console.log('Admin client disconnected');
        }
        else if (clientType === 'tv' && clientId) {
            console.log(`TV client disconnected: ${clientId}`);
            if (tvConnections.get(clientId) === ws) {
                tvConnections.delete(clientId);
                await handleTvConnection(clientId, false, ws);
            }
        }
        else {
            console.log('An unidentified client disconnected');
        }
    });
    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
});
server.listen(PORT, HOST, () => {
    console.log(`Main server (handling HTTP and WS) started on http://${HOST}:${PORT}`);
});
setupNotificationWatcher();
