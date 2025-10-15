
import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { WebSocketServer } from 'ws';
import { getTvById, setTvOnlineStatus, getTvsByGroupId } from './src/lib/data';
import * as fs from 'fs';
import * as path from 'path';
import chokidar from 'chokidar';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 9002;

const app = next({ dev });
const handle = app.getRequestHandler();

const NOTIFICATION_DIR = path.join(process.cwd(), '.notifications');

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      const { pathname } = parsedUrl;
      
      // Crucially, we do not let Next.js handle the WebSocket path.
      if (pathname === '/ws') {
        // This will be handled by the 'upgrade' event listener.
        // We can end the response here for any non-upgrade requests to /ws.
        res.writeHead(404);
        res.end();
        return;
      }
      
      await handle(req, res, parsedUrl);
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
            const tvs = await getTvsByGroupId(notification.id);
            tvs.forEach(tv => sendRefreshToTv(tv.tvId));
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
      const tvDoc = await getTvById(tvId);
      if (tvDoc) {
        console.log(`[Socket Server] Sending REFRESH_STATE to ${tvId}`);
        ws.send(JSON.stringify({ type: 'REFRESH_STATE' }));
      } else {
        console.log(`[Socket Server] Received notification for unregistered TV ${tvId}, skipping.`);
      }
    } else {
      console.log(`[Socket Server] No active connection found for TV ${tvId} to send refresh.`);
    }
  };

  const handleTvConnection = async (tvId: string, isConnecting: boolean, ws: import('ws')) => {
    // Pass the actual ws connection object to get a unique identifier
    const socketId = isConnecting ? `ws-${Date.now()}` : null;
    try {
      await setTvOnlineStatus(tvId, isConnecting, socketId);
      broadcastToAdmins({ type: 'status-changed', payload: { tvId, isOnline: isConnecting } });
    } catch (error) {
      console.error(`[Socket Server] Error updating TV status for ${tvId}:`, error);
    }
  };
  
  server.on('upgrade', (request, socket, head) => {
    const { pathname } = parse(request.url!, true);
    if (pathname === '/ws') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    } else {
      // This is important: If the upgrade is not for our websocket, we must destroy the socket.
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
            console.log('[Socket Server] Admin client connected');
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
              console.log(`[Socket Server] TV connection opened: ${clientId}`);
              const tvDoc = await getTvById(clientId);
              if (tvDoc) {
                await handleTvConnection(clientId, true, ws);
              } else {
                console.log(`[Socket Server] TV is not registered yet. Connection is pending registration for: ${clientId}`);
              }
              ws.send(JSON.stringify({ type: 'registered', tvId: clientId }));
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
        console.log('[Socket Server] Admin client disconnected');
      } else if (clientType === 'tv' && clientId) {
        const currentClientId = clientId;
        if (tvConnections.get(currentClientId) === ws) {
          tvConnections.delete(currentClientId);
          console.log(`[Socket Server] TV client disconnected: ${currentClientId}`);
          await handleTvConnection(currentClientId, false, ws);
        } else {
          console.log(`[Socket Server] An old connection for ${currentClientId} closed.`);
        }
      } else {
        console.log('[Socket Server] An unidentified client disconnected');
      }
    });

    ws.on('error', (error) => {
      console.error('[Socket Server] WebSocket error:', error);
    });
  });

  setupNotificationWatcher();

  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
