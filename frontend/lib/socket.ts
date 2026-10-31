// ============================================================
// Socket.IO client singleton
// ============================================================
import { io, Socket } from 'socket.io-client';

const PRODUCTION_BACKEND_URL = 'https://phantom-strike-5.onrender.com';

function resolveBackendUrl(): string {
  // 1. Explicit environment variable if configured
  const envUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_SOCKET_URL;
  if (envUrl && !envUrl.includes('localhost')) {
    return envUrl;
  }

  // 2. Browser runtime on production domain (e.g. vercel.app or any remote host)
  if (typeof window !== 'undefined') {
    const isLocalhost =
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1';
    if (!isLocalhost) {
      return PRODUCTION_BACKEND_URL;
    }
  }

  // 3. Localhost development fallback
  return envUrl || 'http://localhost:3001';
}

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    const backendUrl = resolveBackendUrl();
    socket = io(backendUrl, {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      transports: ['polling', 'websocket'],
    });
  }
  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
