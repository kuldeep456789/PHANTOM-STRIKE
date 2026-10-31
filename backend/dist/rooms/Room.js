"use strict";
// ============================================================
// Room — holds all state for one game room
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.Room = void 0;
const GameState_1 = require("../game/GameState");
class Room {
    constructor(roomCode) {
        // Server-only: submitted actions this round (not sent to clients until reveal)
        this.pendingActions = new Map();
        // Disconnect tracking: playerId → consecutive missed rounds
        this.missedRounds = new Map();
        this.roomCode = roomCode;
        this.state = (0, GameState_1.createInitialGameState)(roomCode);
    }
    get players() {
        return this.state.players;
    }
    get connectedPlayers() {
        return this.state.players.filter((p) => p.isConnected);
    }
    getPlayer(id) {
        return this.state.players.find((p) => p.id === id);
    }
    addPlayer(player) {
        this.state.players.push(player);
        this.missedRounds.set(player.id, 0);
    }
    removePlayer(id) {
        this.state.players = this.state.players.filter((p) => p.id !== id);
        this.missedRounds.delete(id);
        this.pendingActions.delete(id);
    }
    markDisconnected(id) {
        const p = this.getPlayer(id);
        if (p)
            p.isConnected = false;
    }
    markConnected(id) {
        const p = this.getPlayer(id);
        if (p) {
            p.isConnected = true;
            this.missedRounds.set(id, 0);
        }
    }
    isAvatarTaken(avatarId) {
        return this.state.players.some((p) => p.avatarId === avatarId);
    }
    allConnectedSubmitted() {
        return this.connectedPlayers.every((p) => p.hasSubmitted);
    }
    resetRoundSubmissions() {
        for (const p of this.state.players) {
            p.hasSubmitted = false;
        }
        this.pendingActions.clear();
    }
    clearTimer() {
        if (this.roundTimer) {
            clearTimeout(this.roundTimer);
            this.roundTimer = undefined;
        }
    }
}
exports.Room = Room;
