"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function useAdminWebSocket() {
  const router = useRouter();

  useEffect(() => {
    // Only run on the client
    if (typeof window === 'undefined') return;

    // Dynamically construct the WebSocket URL
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname;
    // In production, the WebSocket server is on a different port.
    // In development, the Next.js dev server proxies WebSocket requests, so we don't need a port.
    const wsPort = process.env.NODE_ENV === 'production' ? ':8081' : '';
    const wsUrl = `${protocol}//${host}${wsPort}/?clientType=admin`;
    
    let ws: WebSocket;
    let reconnectTimeout: NodeJS.Timeout | null = null;

    function connect() {
      try {
        console.log(`[Admin WebSocket] Attempting to connect to: ${wsUrl}`);
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          console.log('[Admin WebSocket] Connection established');
          if (reconnectTimeout) {
            clearTimeout(reconnectTimeout);
            reconnectTimeout = null;
          }
        };

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            console.log('[Admin WebSocket] Received message:', message);
            
            // If the server tells us the status of a TV changed, refresh page data
            if (message.type === 'tv-status-changed') {
              console.log('TV status changed, refreshing data...');
              router.refresh();
            }
          } catch (error) {
            console.error('[Admin WebSocket] Error parsing message:', error);
          }
        };

        ws.onclose = () => {
          console.log('[Admin WebSocket] Connection closed. Reconnecting in 5 seconds...');
          if (!reconnectTimeout) {
            reconnectTimeout = setTimeout(connect, 5000); // Attempt to reconnect after 5 seconds
          }
        };

        ws.onerror = (error) => {
          console.error('[Admin WebSocket] Error:', error);
          ws.close(); // This will trigger the onclose handler and reconnection attempt
        };

      } catch (e) {
        console.error("Could not create WebSocket connection to server", e);
        if (!reconnectTimeout) {
          reconnectTimeout = setTimeout(connect, 5000);
        }
      }
    }

    connect();

    // Cleanup the connection when the component unmounts
    return () => {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (ws) {
        // Prevent reconnection attempts on unmount
        ws.onclose = () => {}; 
        ws.close();
      }
    };
  }, [router]);
}
