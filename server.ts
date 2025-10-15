
import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { WebSocketServer } from 'ws';
import { setTvOnlineStatus, getTvById, getTvsByGroupId } from './src/lib/data';
import { getSubscriber } from './src/lib/redis';
import type { Notification } from './src/lib/ws-notifications';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = dev ? 9002 : 3000;
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

const tvConnections = new Map<string, import('ws')>();
const adminConnections = new Set<import('ws')>();

const handleTvConnection = async (tvId: string, isConnecting: boolean, socketId: string | null) => {
  try {
    await setTvOnlineStatus(tvId, isConnecting, socketId);
    // Admin notification is now handled via Redis Pub/Sub
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

  // --- Redis Subscriber Logic ---
  try {
    const subscriber = await getSubscriber();
    await subscriber.subscribe('ws-notifications', async (message) => {
        console.log('Redis subscriber received message:', message);
        try {
            const notification = JSON.parse(message) as Notification;

            if (notification.type === 'tv') {
                sendToTv(notification.id, { type: 'REFRESH_STATE' });
            } else if (notification.type === 'group') {
                const tvs = await getTvsByGroupId(notification.id);
                tvs.forEach(tv => {
                    sendToTv(tv.tvId, { type: 'REFRESH_STATE' });
                });
            } else if (notification.type === 'all-admins') {
                sendToAllAdmins({ type: 'refresh-request' });
            }
        } catch (e) {
            console.error('Error processing Redis message:', e);
        }
    });
    console.log('Subscribed to Redis channel: ws-notifications');
  } catch (error) {
      console.error('Could not connect to Redis or subscribe. Real-time notifications will not work.', error);
  }


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
                    
                    if (tvConnections.has(clientId)) {
                        console.log(`Terminating old connection for ${clientId}`);
                        tvConnections.get(clientId)?.terminate();
                    }

                    tvConnections.set(clientId, ws);
                    console.log(`TV connection opened: ${clientId}`);
                    
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
  });
});
