
import { config } from 'dotenv';
config(); // Load environment variables from .env file

import { WebSocketServer, WebSocket } from 'ws';
import { getTvById, setTvOnlineStatus, getTvsByGroupId } from './lib/data';
import chokidar from 'chokidar';
import fs from 'fs/promises';
import path from 'path';

const PORT = 8080;
const wss = new WebSocketServer({ port: PORT });

// Separate maps for different client types
const tvConnections = new Map<string, WebSocket>();
const adminConnections = new Set<WebSocket>();

const NOTIFICATION_DIR = path.join(process.cwd(), '.notifications');

console.log(`WebSocket server started on ws://localhost:${PORT}`);

// Function to broadcast messages to all admin clients
const broadcastToAdmins = (message: object) => {
    const messageString = JSON.stringify(message);
    adminConnections.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(messageString);
        }
    });
};

const setupNotificationWatcher = async () => {
    try {
        await fs.mkdir(NOTIFICATION_DIR, { recursive: true });
        console.log(`Watching for notifications in: ${NOTIFICATION_DIR}`);
        const watcher = chokidar.watch(NOTIFICATION_DIR, {
            ignored: /^\./,
            persistent: true,
            ignoreInitial: true,
        });

        watcher.on('add', async (filePath) => {
            try {
                const content = await fs.readFile(filePath, 'utf-8');
                const notification = JSON.parse(content);
                console.log('Processing notification:', notification);
                
                if (notification.type === 'tv') {
                    await sendRefreshToTv(notification.id);
                } else if (notification.type === 'group') {
                    const tvs = await getTvsByGroupId(notification.id);
                    tvs.forEach(tv => sendRefreshToTv(tv.tvId));
                }

                // Clean up the notification file
                await fs.unlink(filePath);

            } catch (error) {
                console.error(`Error processing notification file ${filePath}:`, error);
            }
        });

    } catch (error) {
        console.error('Error setting up notification watcher:', error);
    }
};

const sendRefreshToTv = async (tvId: string) => {
    const ws = tvConnections.get(tvId);
    if (ws && ws.readyState === WebSocket.OPEN) {
        const tvDoc = await getTvById(tvId);
        // If the TV is registered, update its online status and tell it to refresh
        if (tvDoc) {
             // Mark as online
            if (tvDoc.socketId === null) {
                console.log(`TV ${tvId} is now registered and connected, marking as online.`);
                await handleTvConnection(tvId, true, ws);
            }
            console.log(`Sending REFRESH_STATE to ${tvId}`);
            ws.send(JSON.stringify({ type: 'REFRESH_STATE' }));
        } else {
             console.log(`Received notification for unregistered TV ${tvId}, skipping.`);
        }
    } else {
        console.log(`No active connection found for TV ${tvId} to send refresh.`);
    }
};

const handleTvConnection = async (tvId: string, isConnecting: boolean, ws: WebSocket) => {
    const socketId = isConnecting ? `ws-${Date.now()}` : null;
    try {
        await setTvOnlineStatus(tvId, isConnecting, socketId);
        broadcastToAdmins({ type: 'status-changed', payload: { tvId, isOnline: isConnecting } });
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
                        await handleTvConnection(clientId, true, ws);
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
            if (tvConnections.get(clientId) === ws) {
                tvConnections.delete(clientId);
                await handleTvConnection(clientId, false, ws);
            }
        } else {
            console.log('An unidentified client disconnected');
        }
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
});

setupNotificationWatcher();
