
import { config } from 'dotenv';
config(); // Load environment variables from .env file

import { WebSocketServer, WebSocket } from 'ws';
import { getTvById, getTvsByGroupId } from './lib/data';
import chokidar from 'chokidar';
import fs from 'fs/promises';
import path from 'path';

const PORT = 8080;
const wss = new WebSocketServer({ port: PORT });

// In-memory mapping of tvId to WebSocket connection
const tvConnections = new Map<string, WebSocket>();
const adminConnections = new Set<WebSocket>();
const NOTIFICATION_DIR = path.join(process.cwd(), '.notifications');

// The URL for the internal API route in the Next.js app
const NEXTJS_APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';
const TV_STATUS_API_ENDPOINT = `${NEXTJS_APP_URL}/api/tv-status`;
const API_SECRET = process.env.INTERNAL_API_SECRET || 'your-secret-key';


console.log(`WebSocket server started on ws://localhost:${PORT}`);

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
                    sendRefreshToTv(notification.id);
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
}

/**
 * Notifies the Next.js app to update the TV's online status.
 */
const updateTvOnlineStatusInApi = async (tvId: string, isOnline: boolean, socketId: string | null) => {
    try {
        console.log(`Notifying Next.js to update status for ${tvId} to ${isOnline ? 'online' : 'offline'}`);
        const response = await fetch(TV_STATUS_API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_SECRET}`
            },
            body: JSON.stringify({ tvId, isOnline, socketId }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API call failed with status ${response.status}: ${errorText}`);
        }

        const result = await response.json();
        console.log(`Successfully notified Next.js for ${tvId}:`, result.message);
        
        // After successful API update, notify admin clients
        broadcastToAdmins({ type: 'tv-status-changed', payload: { tvId, isOnline } });

    } catch (error) {
        console.error(`Failed to update TV online status via API for ${tvId}:`, error);
    }
};


const sendRefreshToTv = (tvId: string) => {
    const ws = tvConnections.get(tvId);
    if (ws && ws.readyState === WebSocket.OPEN) {
        console.log(`Sending REFRESH_STATE to ${tvId}`);
        ws.send(JSON.stringify({ type: 'REFRESH_STATE' }));
    } else {
        console.log(`No active connection found for TV ${tvId} to send refresh.`);
    }
};

const broadcastToAdmins = (message: object) => {
    console.log(`Broadcasting to ${adminConnections.size} admin clients:`, message);
    adminConnections.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(message));
        }
    });
}

wss.on('connection', (ws) => {
    let tvId: string | null = null;
    let clientType: 'tv' | 'admin' | null = null;

    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message.toString());

            if (data.type === 'register-tv' && data.payload?.tvId) {
                clientType = 'tv';
                const incomingTvId = data.payload.tvId;
                tvId = incomingTvId;
                
                if (tvConnections.has(incomingTvId)) {
                    console.log(`Terminating old connection for ${incomingTvId}`);
                    tvConnections.get(incomingTvId)?.terminate();
                }

                tvConnections.set(incomingTvId, ws);
                console.log(`TV connection opened: ${incomingTvId}`);

                const tvDoc = await getTvById(incomingTvId);
                if (tvDoc) {
                    const socketId = `ws-${Date.now()}`;
                    await updateTvOnlineStatusInApi(incomingTvId, true, socketId);
                } else {
                    console.log(`TV is not registered. Skipping online status update for: ${incomingTvId}`);
                }
                ws.send(JSON.stringify({ type: 'registered', tvId: incomingTvId }));

            } else if (data.type === 'register-admin') {
                clientType = 'admin';
                adminConnections.add(ws);
                console.log(`Admin client connected. Total admins: ${adminConnections.size}`);
                ws.send(JSON.stringify({ type: 'admin-registered' }));
            }
             else {
                console.log('Received unknown message type:', data.type);
            }
        } catch (error) {
            console.error(`Failed to process message: ${message.toString()}`, error);
        }
    });

    ws.on('close', async () => {
        if (clientType === 'tv' && tvId) {
            console.log(`TV client disconnected: ${tvId}`);
            if (tvConnections.get(tvId) === ws) {
                tvConnections.delete(tvId);
                await updateTvOnlineStatusInApi(tvId, false, null);
            }
        } else if (clientType === 'admin') {
            adminConnections.delete(ws);
            console.log(`Admin client disconnected. Total admins: ${adminConnections.size}`);
        } else {
            console.log('An unregistered client disconnected');
        }
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
});

setupNotificationWatcher();
