
// src/app/api/ws/[...path]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import httpProxy from 'http-proxy';
import { NextApiRequest } from 'next';

const socketPort = process.env.SOCKET_PORT || 9001;
const proxy = httpProxy.createProxyServer({
    target: `http://localhost:${socketPort}`,
    ws: true,
    changeOrigin: true,
});

export const GET = async (req: NextRequest) => {
    // This is the key part for WebSocket upgrades.
    // http-proxy needs the raw Node.js request and socket objects.
    // Next.js exposes these through a custom, non-standard interface.
    // @ts-ignore
    const { res: socket, req: rawReq } = NextResponse.next();
    
    // The cast to NextApiRequest is necessary to access the underlying Node.js objects.
    // This is a known workaround for handling WebSockets in Next.js API Routes.
    const nodeReq = req as unknown as NextApiRequest;
    
    return new Promise((resolve) => {
        proxy.web(nodeReq, nodeReq.res, {
            target: `http://localhost:${socketPort}`,
        }, (err) => {
            console.error('Proxy error:', err);
            resolve(NextResponse.json({ message: 'Proxy error' }, { status: 500 }));
        });

        proxy.once('proxyRes', () => {
            // After the proxy response, we resolve the promise.
            // For WebSocket upgrades, this response is what finalizes the handshake.
            resolve(socket as any);
        });
    });
};
