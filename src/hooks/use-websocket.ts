"use client";

import { useEffect, useRef } from 'react';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080';

interface WebSocketProps {
  onOpen?: () => void;
  onClose?: () => void;
  onMessage?: (event: any) => void;
  onError?: (error: Event) => void;
}

export function useWebSocket({ onOpen, onClose, onMessage, onError }: WebSocketProps) {
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!ws.current) {
      ws.current = new WebSocket(WS_URL);

      ws.current.onopen = () => {
        console.log('Admin WebSocket connected');
        // Register this client as an admin UI
        ws.current?.send(JSON.stringify({ type: 'register-admin' }));
        onOpen?.();
      };

      ws.current.onclose = () => {
        console.log('Admin WebSocket disconnected');
        onClose?.();
      };

      ws.current.onerror = (error) => {
        console.error('Admin WebSocket error:', error);
        onError?.(error);
      };
    }

    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        onMessage?.(data);
      } catch (e) {
        console.error('Failed to parse WebSocket message:', event.data);
      }
    };
    
    ws.current.addEventListener('message', handleMessage);

    return () => {
      // Clean up the event listener
      ws.current?.removeEventListener('message', handleMessage);
      // Optional: close the connection when the component unmounts
      // ws.current?.close(); 
    };
  }, [onOpen, onClose, onMessage, onError]);
}
