'use client';

import { useEffect, useRef, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { getSocket } from '@/lib/socket';

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;

    if (!socket.connected) {
      socket.connect();
    }

    return () => {
      // Don't disconnect on unmount — connection is shared across pages
    };
  }, []);

  const on = useCallback((event: string, handler: (...args: unknown[]) => void) => {
    const socket = getSocket();
    socket.on(event, handler);
    return () => {
      socket.off(event, handler);
    };
  }, []);

  const emit = useCallback((event: string, payload?: unknown) => {
    const socket = getSocket();
    socket.emit(event, payload);
  }, []);

  return { on, emit, socket: socketRef };
}
