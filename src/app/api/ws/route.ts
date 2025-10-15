// IMPORTANT: This is a workaround for environments where a standalone WebSocket
// server isn't feasible, like some serverless platforms. It uses a Next.js
// API route to "hijack" the connection and upgrade it to a WebSocket.
// This is NOT the standard or recommended way to run a WebSocket server.

import { Server, WebSocket } from 'ws';
import { setTvOnlineStatus, getTvById } from '@/lib/data';
import { setNotificationCallback, notifyAdmins } from '@/lib/ws-notifications';
import type { Socket } from 'net';
import type { NextRequest } from 'next/server';

// This function is called once to attach the WebSocket server to the main HTTP server.
const setupWebSocketServer = (server: any) => {
    if (server.wss) {
        console.log("WebSocket server already attached.");
        return;
    }
    console.log("Attaching WebSocket server.");

    const wss = new Server({ noServer: true });
    server.wss = wss; // Store wss on the server object to avoid re-creation

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

    server.on('upgrade', (request: any, socket: any, head: any) => {
        // Ensure this is the ws endpoint before handling the upgrade
        if (request.url === '/api/ws') {
            wss.handleUpgrade(request, socket, head, (ws) => {
                wss.emit('connection', ws, request);
            });
        } else {
            socket.destroy();
        }
    });
};

export async function GET(req: NextRequest) {
    // This part is crucial. We need to access the underlying Node.js HTTP server.
    // The `req.socket` object in Next.js API routes provides a way to get to it.
    // @ts-ignore
    const server = req.socket?.server;
    
    if (server) {
        setupWebSocketServer(server);
    } else {
        console.error("Could not access the HTTP server to set up WebSocket.");
    }
    
    // The GET request itself doesn't need to do anything with WebSockets.
    // It's just a trigger to ensure our setup logic runs.
    // We can return an empty response, or an informational one.
    // Returning a 426 is a signal that this endpoint is for upgrades, but it's not strictly necessary.
    return new Response(null, { status: 426, statusText: 'Upgrade Required' });
}
