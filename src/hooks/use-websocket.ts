"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function useWebSocket() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const wsUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL;

    if (!wsUrl) {
      console.error("NEXT_PUBLIC_WEBSOCKET_URL is not defined. Cannot initialize admin WebSocket.");
      return;
    }
    
    let ws: WebSocket | null = null;
    let reconnectInterval: NodeJS.Timeout;

    function connect() {
      try {
        console.log(`Attempting to connect Admin WebSocket to: ${wsUrl}`);
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          console.log('Admin WebSocket connection established');
          ws?.send(JSON.stringify({ type: 'register', payload: { clientType: 'admin' } }));
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
          // Attempt to reconnect
          reconnectInterval = setTimeout(connect, 5000);
        };

        ws.onerror = (error) => {
          console.error('Admin WebSocket error:', error);
          ws?.close();
        };

      } catch(e) {
          console.error("Could not create WebSocket connection to server", e);
      }
    }

    connect();

    return () => {
      if (reconnectInterval) {
        clearTimeout(reconnectInterval);
      }
      if (ws) {
        // Use a 1000 code for normal closure
        ws.close(1000, "Admin component unmounting");
      }
    };
  }, [router]);
}
