
import { config } from 'dotenv';
config(); // Load environment variables from .env file FIRST.

import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { WebSocketServer } from 'ws';
import * as path from 'path';
import * as fs from 'fs';
import chokidar from 'chokidar';
import { getTvById, setTvOnlineStatus, getTvsByGroupId } from './src/lib/data';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 9002;

const app = next({ dev });
const handle = app.getRequestHandler();

const NOTIFICATION_DIR = path.join(process.cwd(), '.notifications');

app.prepare().then(() => {
  const server = createServer((req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error handling request:', err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  const wss = new WebSocketServer({ noServer: true });

  const tvConnections = new Map<string, import('ws')>();
  const adminConnections = new Set<import('ws')>();

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
      console.log(`Watching for notifications in: ${NOTIFICATION_DIR}`);
      const watcher = chokidar.watch(NOTIFICATION_DIR, {
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
          } else if (notification.type === 'group') {
            const tvs = await getTvsByGroupId(notification.id);
            tvs.forEach(tv => sendRefreshToTv(tv.tvId));
          }

          await fs.promises.unlink(filePath);
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
    if (ws && ws.readyState === ws.OPEN) {
      const tvDoc = await getTvById(tvId);
      if (tvDoc) {
        if (tvDoc.socketId === null) {
          console.log(`TV ${tvId} is now registered and connected, marking as online.`);
          await handleTvConnection(tvId, true);
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

  const handleTvConnection = async (tvId: string, isConnecting: boolean) => {
    const socketId = isConnecting ? `ws-${Date.now()}` : null;
    try {
      await setTvOnlineStatus(tvId, isConnecting, socketId);
      broadcastToAdmins({ type: 'status-changed', payload: { tvId, isOnline: isConnecting } });
    } catch (error) {
      console.error(`Error updating TV status for ${tvId}:`, error);
    }
  };

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
            if (clientId) {
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
        const currentClientId = clientId;
        // Check if the connection being closed is the current one for this ID
        if (tvConnections.get(currentClientId) === ws) {
            tvConnections.delete(currentClientId);
            console.log(`TV client disconnected: ${currentClientId}`);
            await handleTvConnection(currentClientId, false);
        } else {
            console.log(`An old connection for ${currentClientId} closed.`);
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

  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
