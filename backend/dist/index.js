"use strict";
// ============================================================
// PHANTOM STRIKE — Backend Entry Point
// HTTP + Socket.IO server
// ============================================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const RoomManager_1 = require("./rooms/RoomManager");
const handlers_1 = require("./socket/handlers");
const PORT = parseInt(process.env.PORT ?? '3001', 10);
const rawClientUrl = process.env.CLIENT_URL ?? 'http://localhost:3000';
// Dynamic CORS configuration that reflects origin for localhost and Vercel deployments
const corsOrigin = (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
    if (!origin)
        return callback(null, true);
    // Allow explicit client URL, any Vercel deployment, or localhost
    if (rawClientUrl === '*' ||
        rawClientUrl.includes(origin) ||
        origin.endsWith('.vercel.app') ||
        origin.includes('localhost') ||
        origin.includes('127.0.0.1')) {
        return callback(null, true);
    }
    // Allow all other origins for public party game
    return callback(null, true);
};
// ------------------------------------------------------------------
// Express app + HTTP server
// ------------------------------------------------------------------
const app = (0, express_1.default)();
app.use((0, cors_1.default)({ origin: corsOrigin, credentials: true }));
app.use(express_1.default.json());
// Health check
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', game: 'Phantom Strike' });
});
const httpServer = http_1.default.createServer(app);
// ------------------------------------------------------------------
// Socket.IO
// ------------------------------------------------------------------
const io = new socket_io_1.Server(httpServer, {
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
const roomManager = new RoomManager_1.RoomManager();
// ------------------------------------------------------------------
// Socket connections
// ------------------------------------------------------------------
io.on('connection', (socket) => {
    console.log(`[Socket] Connected: ${socket.id}`);
    (0, handlers_1.registerHandlers)(io, socket, roomManager);
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
