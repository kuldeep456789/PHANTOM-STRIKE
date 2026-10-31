# 🔮 PHANTOM STRIKE

> A real-time multiplayer secret-action party game for 2–8 players.
> Play in your browser. No login. No installation. Just a room code.

---

## Project Structure

```
handshake-ai/
├── shared/          ← TypeScript types shared by frontend & backend
│   └── types.ts
├── backend/         ← Node.js + Socket.IO game server (port 3001)
│   ├── src/
│   │   ├── index.ts           ← Entry point
│   │   ├── game/
│   │   │   ├── GameEngine.ts  ← Action resolution & scoring (authoritative)
│   │   │   ├── GameState.ts   ← State model
│   │   │   └── constants.ts   ← Tunable game values
│   │   ├── rooms/
│   │   │   ├── Room.ts        ← Single room model
│   │   │   └── RoomManager.ts ← Create/find/destroy rooms
│   │   └── socket/
│   │       └── handlers.ts    ← All Socket.IO events
│   └── package.json
├── frontend/        ← Next.js 14 + TypeScript + Tailwind (port 3000)
│   ├── app/
│   │   ├── page.tsx                    ← Landing (create/join)
│   │   ├── lobby/[roomCode]/page.tsx   ← Lobby
│   │   └── game/[roomCode]/page.tsx    ← Active game
│   ├── components/
│   │   ├── ui/          ← Reusable: AvatarCard, CountdownTimer, ErrorToast
│   │   ├── lobby/       ← AvatarPicker, LobbyPlayerList
│   │   ├── game/        ← ActionPanel, RevealCard, Scoreboard
│   │   └── layout/      ← GlassPanel
│   ├── hooks/
│   │   ├── useSocket.ts      ← Socket.IO connection
│   │   └── useGameState.ts   ← Reactive game state
│   └── lib/
│       ├── socket.ts    ← Socket singleton
│       ├── avatars.ts   ← Avatar helpers
│       └── utils.ts     ← cn() utility
└── README.md
```

---

## Quick Start

### 1. Start the backend

```bash
cd backend
npm install
npm run dev
```

Server runs at **http://localhost:3001**

### 2. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

App runs at **http://localhost:3000**

### 3. Play

1. Open **http://localhost:3000** in your browser
2. Click **Create Room** — get a 4-letter code
3. Share the code with friends
4. Everyone picks an avatar and a name
5. Host clicks **Start Game**
6. Each round: secretly pick STRIKE / SHIELD / PHANTOM
7. All actions revealed simultaneously
8. First to 15 points wins!

---

## Game Rules

| Action | Effect |
|--------|--------|
| ⚔️ **STRIKE** | Attack a target. Hit = +2 for you, −2 for them. Blocked = −1 for you, +1 for them. |
| 🛡️ **SHIELD** | Protect yourself. Blocked attack = +1. No attack = +1. |
| 👻 **PHANTOM** | Vanish — untouchable. +1 pt. Reveals one player's action (private intel). |

**Win:** First to **15 points**, or highest score after **10 rounds**.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS |
| Backend | Node.js, Express, Socket.IO |
| Shared types | TypeScript |
| Realtime | Socket.IO (WebSockets) |
| State | Server-authoritative (no client-side scoring) |
| Database | None (in-memory, no persistence needed) |

---

## Environment Variables

**backend/.env**
```
PORT=3001
CLIENT_URL=http://localhost:3000
```

**frontend/.env.local**
```
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
```

