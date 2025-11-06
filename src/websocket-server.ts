'use server';
import 'module-alias/register';

import { WebSocketServer, WebSocket } from 'ws';
import { setTvOnlineStatusAction } from '@/lib/actions';
import { createServer, IncomingMessage, ServerResponse } from 'http';
import { config } from 'dotenv';
config();

const port = parseInt(process.env.PORT || '8081', 10);
const hostname = '0.0.0.0'; // Listen on all available network interfaces
const tvConnections = new Map<string, WebSocket>();
const adminConnections = new Set<WebSocket>();

// Function to broadcast a message to all connected admin clients
function broadcastToAdmins(message: object) {
    const messageString = JSON.stringify(message);
    adminConnections.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(messageString);
        }
    });
}

// Create a simple HTTP server to handle both WebSocket upgrades and internal notification requests.
const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    // Handle the internal notification endpoint
    if (req.url === '/notify' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                const { tvId } = JSON.parse(body);
                if (!tvId) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, message: 'Invalid payload: tvId is missing.' }));
                    return;
                }
                
                const ws = tvConnections.get(tvId);
                if (ws && ws.readyState === WebSocket.OPEN) {
                    // Use the specified server-to-client message format
                    ws.send(JSON.stringify({ type: 'REFRESH_STATE' }));
                    console.log(`[HTTP Notify] Sent REFRESH_STATE to ${tvId}`);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true, message: 'Notification sent.' }));
                } else {
                    console.log(`[HTTP Notify] TV ${tvId} is offline. No notification sent.`);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true, message: 'TV is offline, no notification sent.' }));
                }
            } catch (error) {
                console.error('[HTTP Notify] Error processing notification:', error);
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, message: 'Invalid JSON payload.' }));
            }
        });
    } else {
      res.writeHead(426, { 'Content-Type': 'text/plain' });
      res.end('Upgrade Required');
    }
});

const wss = new WebSocketServer({ server });

wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
    console.log('[WebSocket] A new client connected. Waiting for registration...');

    let registeredTvId: string | null = null;

    ws.on('message', (message: string) => {
        try {
            const parsedMessage = JSON.parse(message);

            if (parsedMessage.type === 'register' && parsedMessage.payload?.tvId) {
                const tvId = parsedMessage.payload.tvId;
                registeredTvId = tvId;

                // Handle TV client registration
                console.log(`[WebSocket] TV client registered with ID: ${tvId}`);
                tvConnections.set(tvId, ws);

                setTvOnlineStatusAction(tvId, true).then(() => {
                    broadcastToAdmins({ type: 'tv-status-changed', payload: { tvId, isOnline: true } });
                }).catch(console.error);

            } else if (parsedMessage.type === 'register' && parsedMessage.payload?.clientType === 'admin') {
                // Handle Admin client registration
                console.log(`[WebSocket] Admin client registered.`);
                adminConnections.add(ws);

            } else {
                console.warn(`[WebSocket] Received unknown message format from client.`);
            }
        } catch (e) {
            console.error('[WebSocket] Error parsing message from client:', e);
        }
    });

    ws.on('close', () => {
        if (registeredTvId) {
            console.log(`[WebSocket] TV client disconnected: ${registeredTvId}`);
            tvConnections.delete(registeredTvId);
            setTvOnlineStatusAction(registeredTvId, false).then(() => {
                broadcastToAdmins({ type: 'tv-status-changed', payload: { tvId: registeredTvId, isOnline: false } });
            }).catch(console.error);
        } else if (adminConnections.has(ws)) {
            console.log(`[WebSocket] Admin client disconnected.`);
            adminConnections.delete(ws);
        } else {
            console.log('[WebSocket] Unregistered client disconnected.');
        }
    });

    ws.on('error', (error) => {
        if (registeredTvId) {
            console.error(`[WebSocket] Error for TV ${registeredTvId}:`, error);
        } else {
            console.error(`[WebSocket] Error for an unregistered client:`, error);
        }
    });
});

server.listen(port, hostname, () => {
    console.log(`> WebSocket Server ready and listening on http://${hostname}:${port}`);
});
