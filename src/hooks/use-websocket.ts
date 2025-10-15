
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function useWebSocket() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const isProduction = process.env.NODE_ENV === 'production';
    const wsProtocol = isProduction ? 'wss:' : 'ws:';
    
    // In production, connect to the same host on the standard port. In dev, connect to the dedicated socket server port.
    const wsHost = isProduction ? window.location.host : 'localhost:9001';
    const wsUrl = `${wsProtocol}//${wsHost}`;
    
    let ws: WebSocket;

    try {
        ws = new WebSocket(wsUrl);
    } catch(e) {
        console.error("Could not create WebSocket connection to server", e);
        return;
    }

    ws.onopen = () => {
      console.log('Admin WebSocket connection established');
      ws.send(JSON.stringify({ type: 'register', payload: { clientType: 'admin' } }));
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('Admin received message:', message);
        
        if (message.type === 'status-changed') {
          console.log('TV status changed, refreshing router...');
          router.refresh();
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onclose = () => {
      console.log('Admin WebSocket connection closed');
    };

    ws.onerror = (error) => {
      console.error('Admin WebSocket error:', error);
    };

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [router]);
}
