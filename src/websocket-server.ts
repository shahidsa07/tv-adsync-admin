import { WebSocketServer } from 'ws';
import { setTvOnlineStatus, getTvById, getTvsByGroupId } from './lib/data';
import { setNotificationCallback } from './lib/ws-notifications';
import 'dotenv/config';

const wss = new WebSocketServer({ port: 9003 });

console.log("WebSocket server starting on port 9003...");

const tvConnections = new Map<string, import('ws')>();
const adminConnections = new Set<import('ws')>();

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

// This is the key part: the WebSocket server sets the callback function
// that server actions will use to send notifications.
setNotificationCallback(async (notification) => {
  console.log('Notification received in WebSocket server:', notification);
  if (notification.type === 'tv') {
    sendToTv(notification.id, { type: 'REFRESH_STATE' });
  } else if (notification.type === 'group') {
    try {
      const tvs = await getTvsByGroupId(notification.id);
      tvs.forEach(tv => {
        sendToTv(tv.tvId, { type: 'REFRESH_STATE' });
      });
    } catch (e) {
      console.error(`Error getting TVs for group ${notification.id}`, e);
    }
  } else if (notification.type === 'all-admins') {
    sendToAllAdmins({ type: 'refresh-request' });
  }
});


const handleTvConnection = async (tvId: string, isConnecting: boolean, socketId: string | null) => {
  try {
    await setTvOnlineStatus(tvId, isConnecting, socketId);
    sendToAllAdmins({ type: 'refresh-request' });
  } catch (error) {
    console.error(`Error updating TV status for ${tvId}:`, error);
  }
};


wss.on('connection', (ws) => {
    let clientId: string | null = null;
    let clientType: 'tv' | 'admin' | null = null;
    
    console.log('A client connected');

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

console.log('WebSocket server is listening on port 9003');
