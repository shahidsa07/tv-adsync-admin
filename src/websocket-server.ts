
import { config } from 'dotenv';
config(); // Load environment variables from .env file

import { WebSocketServer, WebSocket } from 'ws';
import { getTvById, setTvOnlineStatus, getTvsByGroupId } from './lib/data';
import chokidar from 'chokidar';
import fs from 'fs/promises';
import path from 'path';

const PORT = 8080;
const wss = new WebSocketServer({ port: PORT });

// In-memory mapping of tvId to WebSocket connection
const tvConnections = new Map<string, WebSocket>();
const NOTIFICATION_DIR = path.join(process.cwd(), '.notifications');

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
                    sendRefresh(notification.id);
                } else if (notification.type === 'group') {
                    const tvs = await getTvsByGroupId(notification.id);
                    tvs.forEach(tv => sendRefresh(tv.tvId));
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

const sendRefresh = (tvId: string) => {
    const ws = tvConnections.get(tvId);
    if (ws && ws.readyState === WebSocket.OPEN) {
        console.log(`Sending REFRESH_STATE to ${tvId}`);
        ws.send(JSON.stringify({ type: 'REFRESH_STATE' }));
    } else {
        console.log(`No active connection found for TV ${tvId} to send refresh.`);
    }
};

wss.on('connection', (ws) => {
    console.log('Client connected');
    let tvId: string | null = null; // Keep track of the tvId for this connection

    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message.toString());

            if (data.type === 'register' && data.payload?.tvId) {
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
                    await setTvOnlineStatus(incomingTvId, true, socketId);
                    console.log(`TV is registered. Set status to online: ${incomingTvId}`);
                } else {
                    console.log(`TV is not registered in Firestore. Skipping online status update for: ${incomingTvId}`);
                }

                ws.send(JSON.stringify({ type: 'registered', tvId: incomingTvId }));

            } else {
                console.log('Received unknown message type:', data.type);
            }
        } catch (error) {
            console.error(`Failed to process message: ${message.toString()}`, error);
        }
    });

    ws.on('close', async () => {
        if (tvId) {
            console.log(`Client disconnected: ${tvId}`);
            if (tvConnections.get(tvId) === ws) {
                tvConnections.delete(tvId);
                const tvDoc = await getTvById(tvId);
                if (tvDoc) {
                    await setTvOnlineStatus(tvId, false, null);
                }
            }
        } else {
            console.log('An unregistered client disconnected');
        }
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
});

setupNotificationWatcher();
