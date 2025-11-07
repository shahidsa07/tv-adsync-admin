
"use client";

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export function useAdminWebSocket() {
  const router = useRouter();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connectWebSocket = () => {
    // Prevent multiple concurrent connections
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
        return;
    }

    // Construct the WebSocket URL to use the reverse proxy
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host; // e.g., "yourapp.com"
    const wsUrl = `${protocol}//${host}/socket/`;

    console.log(`[Admin] Connecting to WebSocket: ${wsUrl}`);
    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
        console.log('[Admin] WebSocket connection established.');
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }
        // Register this client as an "admin" type
        wsRef.current?.send(JSON.stringify({ type: 'register', payload: { clientType: 'admin' } }));
    };

    wsRef.current.onmessage = (event) => {
        try {
            const message = JSON.parse(event.data);
            console.log('[Admin] Received message:', message);
            
            // If the server tells us the status of a TV changed, refresh the page data
            if (message.type === 'tv-status-changed') {
                console.log('TV status changed, refreshing router...');
                router.refresh();
            }
        } catch (error) {
            console.error('[Admin] Error parsing WebSocket message:', error);
        }
    };

    wsRef.current.onclose = () => {
        console.log('[Admin] WebSocket connection closed. Reconnecting...');
        wsRef.current = null;
        if (!reconnectTimeoutRef.current) {
          reconnectTimeoutRef.current = setTimeout(connectWebSocket, 5000);
        }
    };

    wsRef.current.onerror = (error) => {
        console.error('[Admin] WebSocket error:', error);
        wsRef.current?.close(); // This will trigger the onclose handler for reconnection
    };
  };

  useEffect(() => {
    connectWebSocket();

    // Cleanup the connection when the component unmounts
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        // Set a specific code and reason for a clean, intentional closure
        wsRef.current.close(1000, 'Component unmounting');
        wsRef.current = null;
      }
    };
  }, [router]); // router is a stable dependency
}
