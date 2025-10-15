
import { WebSocket, WebSocketServer } from 'ws';
import { setTvOnlineStatus, getTvById } from '@/lib/data';
import { setNotificationCallback, notifyAdmins } from '@/lib/ws-notifications';
import { config } from 'dotenv';

config(); // Load .env variables

const PORT = 9003;
const wss = new WebSocketServer({ port: PORT });

console.log(`WebSocket server started on port ${PORT}`);

// Store connections in memory.
// In a real, scalable production app, you'd use a shared store like Redis.
const tvConnections = new Map<string, WebSocket>();
const adminConnections = new Set<WebSocket>();

// This function is called from our server-side actions to push updates.
setNotificationCallback((notification) => {
    if (notification.type === 'tv') {
        const ws = tvConnections.get(notification.id);
        if (ws && ws.readyState === WebSocket.OPEN) {
            console.log(`Sending REFRESH_STATE to TV: ${notification.id}`);
            ws.send(JSON.stringify({ type: 'REFRESH_STATE' }));
        }
    } else if (notification.type === 'all-admins') {
        const message = JSON.stringify({ type: 'refresh-request' });
        adminConnections.forEach(ws => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(message);
            }
        });
    }
});

const handleTvConnection = async (tvId: string, isConnecting: boolean) => {
    try {
        await setTvOnlineStatus(tvId, isConnecting, isConnecting ? `ws-${Date.now()}` : null);
        notifyAdmins();
    } catch (error) {
        console.error(`Error updating TV status for ${tvId}:`, error);
    }
};

wss.on('connection', (ws) => {
    let clientId: string | null = null;
    let clientType: 'tv' | 'admin' | null = null;

    ws.on('message', async (message) => {
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
                        tvConnections.get(clientId)?.terminate();
                    }

                    tvConnections.set(clientId, ws);
                    console.log(`TV connection opened: ${clientId}`);

                    const tvDoc = await getTvById(clientId);
                    if (tvDoc) {
                        await handleTvConnection(clientId, true);
                    } else {
                        console.log(`TV is not registered yet. Connection is pending registration for: ${clientId}`);
                    }
                    ws.send(JSON.stringify({ type: 'registered', tvId: clientId }));
                }
            } else {
                console.log('Received unknown message type:', data.type);
            }
        } catch (error) {
            console.error(`Failed to process message: ${message.toString()}`, error);
        }
    });

    ws.on('close', async () => {
        if (clientType === 'admin') {
            adminConnections.delete(ws);
            console.log('Admin client disconnected');
        } else if (clientType === 'tv' && clientId) {
            console.log(`TV client disconnected: ${clientId}`);
            // Only update status if this specific connection was the one registered
            if (tvConnections.get(clientId) === ws) {
                tvConnections.delete(clientId);
                await handleTvConnection(clientId, false);
            }
        } else {
            console.log('An unidentified client disconnected');
        }
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
});
