
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import chokidar from 'chokidar';
import * as fs from 'fs';
import * as path from 'path';

// Note: This server does not have access to the main app's Firebase Admin SDK instance.
// It relies on a file-based notification system to receive commands.

const hostname = '0.0.0.0'; // Listen on all network interfaces
const port = process.env.SOCKET_PORT ? parseInt(process.env.SOCKET_PORT, 10) : 8081;

const server = createServer((req, res) => {
  // This is a dedicated WebSocket server. It does not serve HTTP content.
  // Respond with a 404 for any standard HTTP requests.
  if (req.url === '/health' && req.method === 'GET') {
     res.writeHead(200, { 'Content-Type': 'application/json' });
     res.end(JSON.stringify({ status: 'ok' }));
  } else {
    res.writeHead(404);
    res.end();
  }
});

const wss = new WebSocketServer({ server });

const tvConnections = new Map<string, import('ws')>();
const adminConnections = new Set<import('ws')>();

const NOTIFICATION_DIR = path.join(process.cwd(), '.notifications');

const broadcastToAdmins = (message: object) => {
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
        const watcher = chokidar.watch(NOTIFICATION_DIR, {
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
                } else if (notification.type === 'group') {
                    // This standalone server doesn't know about groups. 
                    // The main app must notify each TV individually.
                    // However, we'll leave this here in case we want to expand functionality later.
                    console.log(`[Socket Server] Group notification received for ${notification.id}, but this server cannot resolve TVs in a group. The main app is responsible for notifying individual TVs.`);
                } else if (notification.type === 'status-change') {
                    broadcastToAdmins({ type: 'status-changed', payload: notification.payload });
                }

                await fs.promises.unlink(filePath);
            } catch (error) {
                console.error(`[Socket Server] Error processing notification file ${filePath}:`, error);
            }
        });
    } catch (error) {
        console.error('[Socket Server] Error setting up notification watcher:', error);
    }
};

const sendRefreshToTv = async (tvId: string) => {
    const ws = tvConnections.get(tvId);
    if (ws && ws.readyState === ws.OPEN) {
        console.log(`[Socket Server] Sending REFRESH_STATE to ${tvId}`);
        ws.send(JSON.stringify({ type: 'REFRESH_STATE' }));
    } else {
        console.log(`[Socket Server] No active connection for TV ${tvId} to send refresh.`);
    }
};

wss.on('connection', (ws) => {
    let clientId: string | null = null;
    let clientType: 'tv' | 'admin' | null = null;

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
                    if (clientId) {
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
            } else {
                console.log('[Socket Server] Received unknown message type:', data.type);
            }
        } catch (error) {
            console.error(`[Socket Server] Failed to process message: ${message.toString()}`, error);
        }
    });

    ws.on('close', async () => {
        if (clientType === 'admin') {
            adminConnections.delete(ws);
            console.log('[Socket Server] Admin client disconnected.');
        } else if (clientType === 'tv' && clientId) {
            // Check if the closing websocket is the one we have on record
            if (tvConnections.get(clientId) === ws) {
                tvConnections.delete(clientId);
                console.log(`[Socket Server] TV disconnected: ${clientId}`);
                
                // Notify main app that TV is offline
                await fs.promises.writeFile(path.join(NOTIFICATION_DIR, `status-${clientId}-off.json`), JSON.stringify({
                    type: 'status-change',
                    payload: { tvId: clientId, isOnline: false }
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
