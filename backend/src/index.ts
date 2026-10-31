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
const corsOrigin = rawClientUrl.includes(',')
  ? rawClientUrl.split(',').map((url) => url.trim())
  : rawClientUrl === '*'
  ? true
  : rawClientUrl;

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
httpServer.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════╗
  ║  🔮 PHANTOM STRIKE SERVER        ║
  ║  Listening on port ${PORT}          ║
  ║  Accepting clients from          ║
  ║  ${rawClientUrl}         ║
  ╚══════════════════════════════════╝
  `);
});
