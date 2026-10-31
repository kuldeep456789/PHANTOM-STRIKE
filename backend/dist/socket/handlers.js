"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerHandlers = registerHandlers;
const GameEngine_1 = require("../game/GameEngine");
const GameState_1 = require("../game/GameState");
const constants_1 = require("../game/constants");
function broadcastState(io, room) {
    io.to(room.roomCode).emit('state_update', (0, GameState_1.toClientState)(room.state));
}
function reassignHost(room) {
    const connected = room.connectedPlayers;
    if (connected.length === 0)
        return;
    // Remove host flag from all
    for (const p of room.players)
        p.isHost = false;
    connected[0].isHost = true;
}
// ------------------------------------------------------------------
// Round lifecycle
// ------------------------------------------------------------------
function startRound(io, room, roomManager) {
    room.state.round += 1;
    room.state.phase = 'ACTION';
    room.state.roundStartedAt = Date.now();
    room.resetRoundSubmissions();
    broadcastState(io, room);
    // Auto-resolve when timer expires
    room.clearTimer();
    room.roundTimer = setTimeout(() => {
        resolveAndReveal(io, room, roomManager);
    }, (constants_1.ROUND_TIME_LIMIT * 1000) + constants_1.ACTION_GRACE_MS);
}
async function resolveAndReveal(io, room, roomManager) {
    room.clearTimer();
    if (room.state.phase !== 'ACTION' && room.state.phase !== 'SUDDEN_DEATH')
        return;
    // --- REVEAL phase ---
    room.state.phase = 'REVEAL';
    broadcastState(io, room);
    // Resolve actions server-side
    const result = (0, GameEngine_1.resolveRound)(room.state.round, room.connectedPlayers, room.pendingActions);
    room.state.lastRoundResult = result;
    // Apply new scores to player objects
    for (const p of room.state.players) {
        if (result.scores[p.id] !== undefined) {
            p.score = result.scores[p.id];
        }
    }
    // Emit reveal event (includes all action details)
    io.to(room.roomCode).emit('round_revealed', result);
    await delay(constants_1.REVEAL_DURATION);
    // --- RESULTS phase ---
    room.state.phase = 'RESULTS';
    broadcastState(io, room);
    await delay(constants_1.RESULTS_DURATION);
    // --- Check win condition ---
    const winCheck = (0, GameEngine_1.checkWinCondition)(room.connectedPlayers, room.state.round, room.state.maxRounds, room.state.pointTarget, room.state.suddenDeathCount);
    if (!winCheck.over) {
        startRound(io, room, roomManager);
        return;
    }
    if (winCheck.suddenDeath) {
        // Start a sudden death round
        room.state.suddenDeathCount += 1;
        room.state.phase = 'SUDDEN_DEATH';
        // Only tied players are active; others are spectating
        const tiedIds = new Set(winCheck.tied.map((p) => p.id));
        broadcastState(io, room);
        // Filter pending actions to only tied players
        room.pendingActions.clear();
        for (const p of room.state.players) {
            p.hasSubmitted = tiedIds.has(p.id) ? false : true; // non-tied pre-submitted
        }
        room.roundTimer = setTimeout(() => {
            resolveAndReveal(io, room, roomManager);
        }, (constants_1.ROUND_TIME_LIMIT * 1000) + constants_1.ACTION_GRACE_MS);
        return;
    }
    // Game over
    room.state.phase = 'GAME_OVER';
    room.state.winner = winCheck.winners.length === 1 ? winCheck.winners[0] : winCheck.winners;
    io.to(room.roomCode).emit('game_over', {
        winner: room.state.winner,
        finalScores: result.scores,
    });
    broadcastState(io, room);
}
function delay(ms) {
    return new Promise((res) => setTimeout(res, ms));
}
// ------------------------------------------------------------------
// Main handler registration
// ------------------------------------------------------------------
function registerHandlers(io, socket, roomManager) {
    // ── CREATE ROOM ────────────────────────────────────────────
    socket.on('create_room', (payload) => {
        try {
            const room = roomManager.createRoom();
            const player = {
                id: socket.id,
                name: payload.playerName.trim().slice(0, 16) || 'Player',
                avatarId: payload.avatarId ?? 0,
                score: 0,
                isHost: true,
                isConnected: true,
                hasSubmitted: false,
            };
            room.addPlayer(player);
            socket.join(room.roomCode);
            socket.emit('room_joined', {
                roomCode: room.roomCode,
                playerId: socket.id,
                gameState: (0, GameState_1.toClientState)(room.state),
            });
            console.log(`[Room ${room.roomCode}] Created by ${player.name}`);
        }
        catch (err) {
            socket.emit('error', { message: 'Failed to create room.' });
        }
    });
    // ── JOIN ROOM ──────────────────────────────────────────────
    socket.on('join_room', (payload) => {
        const result = roomManager.canJoin(payload.roomCode);
        if (!result.ok) {
            socket.emit('error', { message: result.reason });
            return;
        }
        const { room } = result;
        // Avatar conflict check
        const avatarId = room.isAvatarTaken(payload.avatarId)
            ? [0, 1, 2, 3, 4, 5, 6, 7].find((id) => !room.isAvatarTaken(id)) ?? 0
            : payload.avatarId;
        const player = {
            id: socket.id,
            name: payload.playerName.trim().slice(0, 16) || 'Player',
            avatarId,
            score: 0,
            isHost: false,
            isConnected: true,
            hasSubmitted: false,
        };
        room.addPlayer(player);
        socket.join(room.roomCode);
        socket.emit('room_joined', {
            roomCode: room.roomCode,
            playerId: socket.id,
            gameState: (0, GameState_1.toClientState)(room.state),
        });
        // Notify others
        socket.to(room.roomCode).emit('player_joined', { player });
        broadcastState(io, room);
        console.log(`[Room ${room.roomCode}] ${player.name} joined`);
    });
    // ── START GAME ─────────────────────────────────────────────
    socket.on('start_game', (payload) => {
        const room = roomManager.getRoom(payload.roomCode);
        if (!room)
            return socket.emit('error', { message: 'Room not found.' });
        const host = room.getPlayer(socket.id);
        if (!host?.isHost)
            return socket.emit('error', { message: 'Only the host can start.' });
        if (room.connectedPlayers.length < constants_1.MIN_PLAYERS)
            return socket.emit('error', { message: `Need at least ${constants_1.MIN_PLAYERS} players to start.` });
        if (room.state.phase !== 'LOBBY')
            return;
        io.to(room.roomCode).emit('game_started', { gameState: (0, GameState_1.toClientState)(room.state) });
        startRound(io, room, roomManager);
        console.log(`[Room ${room.roomCode}] Game started with ${room.players.length} players`);
    });
    // ── SUBMIT ACTION ──────────────────────────────────────────
    socket.on('submit_action', (payload) => {
        const room = roomManager.getRoom(payload.roomCode);
        if (!room)
            return;
        const player = room.getPlayer(socket.id);
        if (!player)
            return;
        const validPhases = ['ACTION', 'SUDDEN_DEATH'];
        if (!validPhases.includes(room.state.phase))
            return;
        if (player.hasSubmitted)
            return; // ignore duplicates
        // Validate — can't target self or non-existent player
        if (payload.action === 'STRIKE') {
            if (!payload.targetId || payload.targetId === socket.id) {
                return socket.emit('error', { message: 'Choose a valid target.' });
            }
            const target = room.getPlayer(payload.targetId);
            if (!target)
                return socket.emit('error', { message: 'Target not found.' });
        }
        room.pendingActions.set(socket.id, {
            playerId: socket.id,
            action: payload.action,
            targetId: payload.targetId,
        });
        player.hasSubmitted = true;
        broadcastState(io, room);
        // Auto-resolve if everyone submitted
        if (room.allConnectedSubmitted()) {
            room.clearTimer();
            resolveAndReveal(io, room, roomManager);
        }
    });
    // ── PLAY AGAIN ─────────────────────────────────────────────
    socket.on('play_again', (payload) => {
        const room = roomManager.getRoom(payload.roomCode);
        if (!room)
            return;
        const player = room.getPlayer(socket.id);
        if (!player?.isHost)
            return socket.emit('error', { message: 'Only the host can restart.' });
        if (room.state.phase !== 'GAME_OVER')
            return;
        // Reset game state (keep players and room code)
        room.state.phase = 'LOBBY';
        room.state.round = 0;
        room.state.winner = undefined;
        room.state.lastRoundResult = undefined;
        room.state.suddenDeathCount = 0;
        for (const p of room.state.players) {
            p.score = 0;
            p.hasSubmitted = false;
        }
        room.pendingActions.clear();
        broadcastState(io, room);
        console.log(`[Room ${room.roomCode}] Reset to lobby`);
    });
    // ── KICK PLAYER ────────────────────────────────────────────
    socket.on('kick_player', (payload) => {
        const room = roomManager.getRoom(payload.roomCode);
        if (!room)
            return;
        const host = room.getPlayer(socket.id);
        if (!host?.isHost)
            return;
        if (room.state.phase !== 'LOBBY')
            return;
        const kicked = room.getPlayer(payload.targetPlayerId);
        if (!kicked)
            return;
        room.removePlayer(payload.targetPlayerId);
        io.to(payload.targetPlayerId).emit('error', { message: 'You were removed from the room.' });
        io.sockets.sockets.get(payload.targetPlayerId)?.leave(room.roomCode);
        broadcastState(io, room);
    });
    // ── DISCONNECT ─────────────────────────────────────────────
    socket.on('disconnect', () => {
        const room = roomManager.getRoomByPlayerId(socket.id);
        if (!room)
            return;
        const player = room.getPlayer(socket.id);
        if (!player)
            return;
        console.log(`[Room ${room.roomCode}] ${player.name} disconnected`);
        if (room.state.phase === 'LOBBY') {
            // Remove immediately from lobby
            const wasHost = player.isHost;
            room.removePlayer(socket.id);
            if (wasHost)
                reassignHost(room);
            if (room.connectedPlayers.length === 0) {
                roomManager.scheduleDestroy(room.roomCode);
            }
            else {
                socket.to(room.roomCode).emit('player_left', { playerId: socket.id });
                broadcastState(io, room);
            }
            return;
        }
        // In-game disconnect: mark as disconnected
        room.markDisconnected(socket.id);
        // Auto-submit PHANTOM for them if they haven't acted
        if (!player.hasSubmitted && room.state.phase === 'ACTION') {
            room.pendingActions.set(socket.id, {
                playerId: socket.id,
                action: 'PHANTOM',
            });
            player.hasSubmitted = true;
            if (room.allConnectedSubmitted()) {
                room.clearTimer();
                resolveAndReveal(io, room, roomManager);
            }
        }
        socket.to(room.roomCode).emit('player_left', { playerId: socket.id });
        broadcastState(io, room);
        if (room.connectedPlayers.length === 0) {
            roomManager.scheduleDestroy(room.roomCode);
        }
    });
}
