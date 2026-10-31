// ============================================================
// PHANTOM STRIKE — Backend Entry Point
// HTTP + Socket.IO server
// ============================================================

import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { RoomManager } from './rooms/RoomManager';
import { registerHandlers } from './socket/handlers';

const PORT = parseInt(process.env.PORT ?? '3001', 10);
const rawClientUrl = process.env.CLIENT_URL ?? 'http://localhost:3000';

// Dynamic CORS configuration that reflects origin for localhost and Vercel deployments
const corsOrigin = (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
  // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
  if (!origin) return callback(null, true);

  // Allow explicit client URL, any Vercel deployment, or localhost
  if (
    rawClientUrl === '*' ||
    rawClientUrl.includes(origin) ||
    origin.endsWith('.vercel.app') ||
    origin.includes('localhost') ||
    origin.includes('127.0.0.1')
  ) {
    return callback(null, true);
  }

  // Allow all other origins for public party game
  return callback(null, true);
};

// ------------------------------------------------------------------
// Express app + HTTP server
// ------------------------------------------------------------------
const app = express();
app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', game: 'Phantom Strike' });
});

const httpServer = http.createServer(app);

// ------------------------------------------------------------------
// Socket.IO
// ------------------------------------------------------------------
const io = new Server(httpServer, {
  cors: {
    origin: corsOrigin,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingTimeout: 10000,
  pingInterval: 5000,
});

// ------------------------------------------------------------------
// Room manager (in-memory — no DB needed)
// ------------------------------------------------------------------
const roomManager = new RoomManager();

// ------------------------------------------------------------------
// Socket connections
// ------------------------------------------------------------------
io.on('connection', (socket) => {
  console.log(`[Socket] Connected: ${socket.id}`);
  registerHandlers(io, socket, roomManager);
});

// ------------------------------------------------------------------
// Start
// ------------------------------------------------------------------
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`
  ╔══════════════════════════════════╗
  ║  🔮 PHANTOM STRIKE SERVER        ║
  ║  Listening on port ${PORT}          ║
  ║  Accepting clients from          ║
  ║  ${rawClientUrl} (and *.vercel.app) ║
  ╚══════════════════════════════════╝
  `);
});
