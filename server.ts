
import { config } from 'dotenv';
config(); // Load environment variables from .env file FIRST.

import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { WebSocketServer } from 'ws';
import { setTvOnlineStatus, getTvById, getTvsByGroupId } from './src/lib/data';
import * as fs from 'fs';
import * as path from 'path';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = dev ? 9002 : 3000;
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

const tvConnections = new Map<string, import('ws')>();
const adminConnections = new Set<import('ws')>();

const NOTIFICATION_DIR = path.join(process.cwd(), '.notifications');

const handleTvConnection = async (tvId: string, isConnecting: boolean, socketId: string | null) => {
  try {
    await setTvOnlineStatus(tvId, isConnecting, socketId);
    sendToAllAdmins({ type: 'refresh-request' });
  } catch (error) {
    console.error(`Error updating TV status for ${tvId}:`, error);
  }
};

const sendToTv = (tvId: string, message: any) => {
    const ws = tvConnections.get(tvId);
    if (ws && ws.readyState === 1 /* OPEN */) {
        console.log(`Sending message to TV: ${tvId}`);
        ws.send(JSON.stringify(message));
    }
}

const sendToAllAdmins = (message: any) => {
    const messageString = JSON.stringify(message);
    adminConnections.forEach(ws => {
        if (ws.readyState === 1 /* OPEN */) {
            ws.send(messageString);
        }
    });
}

// --- File-based Notification Handler ---
async function setupNotificationWatcher() {
    console.log(`Watching for notifications in: ${NOTIFICATION_DIR}`);
    // Ensure the notification directory exists
    try {
        await fs.promises.mkdir(NOTIFICATION_DIR, { recursive: true });
    } catch (e) {
        console.error("Could not create notification directory", e);
    }
    
    // Process any existing files
    try {
        const existingFiles = await fs.promises.readdir(NOTIFICATION_DIR);
        for (const file of existingFiles) {
            await processNotificationFile(path.join(NOTIFICATION_DIR, file));
        }
    } catch (error) {
        console.error("Error processing existing notification files:", error);
    }


    // Watch for new files
    fs.watch(NOTIFICATION_DIR, async (eventType, filename) => {
        if ((eventType === 'rename' || eventType === 'change') && filename) { // 'rename' is often used for new files
             await processNotificationFile(path.join(NOTIFICATION_DIR, filename));
        }
    });
}

async function processNotificationFile(filePath: string) {
    // Add a small delay and check for existence to handle file system race conditions
    await new Promise(resolve => setTimeout(resolve, 50)); 
    try {
        const content = await fs.promises.readFile(filePath, 'utf8');
        await fs.promises.unlink(filePath); // Delete immediately after reading
        
        const notification = JSON.parse(content);
        console.log('Notification received via file:', notification);

        if (notification.type === 'tv') {
            sendToTv(notification.id, { type: 'REFRESH_STATE' });
        } else if (notification.type === 'group') {
            try {
                const tvs = await getTvsByGroupId(notification.id);
                tvs.forEach(tv => {
                    sendToTv(tv.tvId, { type: 'REFRESH_STATE' });
                });
            } catch (e) {
                 console.error('Error sending group notification:', e);
            }
        } else if (notification.type === 'all-admins') {
            sendToAllAdmins({ type: 'refresh-request' });
        }

    } catch (error: any) {
        if (error.code !== 'ENOENT') { // ENOENT means file not found, which is okay if it was processed and deleted quickly
            console.error(`Error processing notification file ${filePath}:`, error);
        }
    }
}

app.prepare().then(async () => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error handling request:', err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  const wss = new WebSocketServer({ noServer: true });

  await setupNotificationWatcher();


  server.on('upgrade', (request, socket, head) => {
    const { pathname } = parse(request.url!, true);
    if (pathname === '/ws') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    } else {
      socket.destroy();
    }
  });

  wss.on('connection', (ws) => {
    let clientId: string | null = null;
    let clientType: 'tv' | 'admin' | null = null;

    console.log('A client connected via WebSocket');
    
    ws.on('message', async (message) => {
         try {
            const data = JSON.parse(message.toString());
            console.log('Received message:', data);

            if (data.type === 'register' && data.payload) {
                const { tvId, clientType: type } = data.payload;

                if (type === 'admin') {
                    clientType = 'admin';
                    adminConnections.add(ws);
                    console.log('Admin client connected and registered');
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
                    console.log(`TV connection opened and registered: ${clientId}`);
                    
                    const tvDoc = await getTvById(clientId);
                    if (tvDoc) {
                        await handleTvConnection(clientId, true, `ws-${Date.now()}`);
                    }
                    ws.send(JSON.stringify({ type: 'registered', tvId: clientId }));
                }
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
                await handleTvConnection(clientId, false, null);
            }
        } else {
             console.log('An un-registered client disconnected.');
        }
    });

    ws.on('error', (error) => {
      console.error('WebSocket error on connection:', error);
    });
  });

  const portToListen = dev ? port : process.env.PORT || 3000;
  const hostToListen = '0.0.0.0';

  server.listen(portToListen, hostToListen, (err?: Error) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${portToListen}`);
    console.log(`> WebSocket server listening on ws://${hostname}:${portToListen}/ws`);
  });
});
