
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

let ws: WebSocket | null = null;

const connect = (router: any) => {
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
        console.log('Admin WebSocket connection already established or connecting.');
        return;
    }
    
    if (typeof window === 'undefined') return;

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsHost = `${wsProtocol}//${window.location.host}/api/ws`;
    
    console.log(`Attempting to connect to WebSocket at ${wsHost}`);

    try {
        ws = new WebSocket(wsHost);
    } catch(e) {
        console.error("Could not create WebSocket connection to server", e);
        return;
    }

    ws.onopen = () => {
      console.log('Admin WebSocket connection established');
      ws?.send(JSON.stringify({ type: 'register', payload: { clientType: 'admin' } }));
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('Admin received message:', message);
        
        if (message.type === 'status-changed' || message.type === 'refresh-request') {
          console.log('State changed on server, refreshing router...');
          router.refresh();
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onclose = (event) => {
      console.log('Admin WebSocket connection closed:', event.code, event.reason);
      ws = null;
      // Attempt to reconnect after a delay
      setTimeout(() => connect(router), 5000);
    };

    ws.onerror = (error) => {
      console.error('Admin WebSocket error:', error);
      ws?.close();
    };
}

export function useWebSocket() {
  const router = useRouter();

  useEffect(() => {
    connect(router);

    // No cleanup function, we want it to persist and reconnect
  }, [router]); 
}
