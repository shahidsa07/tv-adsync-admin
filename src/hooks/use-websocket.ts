
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function useWebSocket() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const wsUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL!;
    
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

    ws.onclose = (event) => {
      console.log('Admin WebSocket connection closed', event.code, event.reason);
    };

    ws.onerror = (error) => {
      console.error('Admin WebSocket error:', error);
    };

    return () => {
      if (ws) {
        // Use a 1000 code for normal closure
        ws.close(1000, "Admin component unmounting");
      }
    };
  }, [router]);
}
