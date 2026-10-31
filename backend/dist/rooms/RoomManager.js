"use strict";
// ============================================================
// RoomManager — creates, finds, and destroys rooms
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoomManager = void 0;
const Room_1 = require("./Room");
const constants_1 = require("../game/constants");
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // omit I/O to avoid confusion
class RoomManager {
    constructor() {
        this.rooms = new Map();
    }
    // ------------------------------------------------------------------
    createRoom() {
        let code;
        do {
            code = Array.from({ length: constants_1.ROOM_CODE_LENGTH }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join('');
        } while (this.rooms.has(code));
        const room = new Room_1.Room(code);
        this.rooms.set(code, room);
        return room;
    }
    // ------------------------------------------------------------------
    getRoom(code) {
        return this.rooms.get(code.toUpperCase());
    }
    // ------------------------------------------------------------------
    destroyRoom(code) {
        const room = this.rooms.get(code);
        if (room) {
            room.clearTimer();
            this.rooms.delete(code);
        }
    }
    // ------------------------------------------------------------------
    canJoin(code) {
        const room = this.getRoom(code);
        if (!room)
            return { ok: false, reason: 'Room not found. Check the code and try again.' };
        if (room.state.phase !== 'LOBBY')
            return { ok: false, reason: 'Game already in progress.' };
        if (room.players.length >= constants_1.MAX_PLAYERS)
            return { ok: false, reason: 'Room is full (8/8).' };
        return { ok: true, room };
    }
    // ------------------------------------------------------------------
    getRoomByPlayerId(playerId) {
        for (const room of this.rooms.values()) {
            if (room.getPlayer(playerId))
                return room;
        }
        return undefined;
    }
    // ------------------------------------------------------------------
    /** Schedule room destruction after timeout if empty */
    scheduleDestroy(code, delayMs = 60000) {
        setTimeout(() => {
            const room = this.getRoom(code);
            if (room && room.connectedPlayers.length === 0) {
                this.destroyRoom(code);
                console.log(`[RoomManager] Destroyed empty room ${code}`);
            }
        }, delayMs);
    }
}
exports.RoomManager = RoomManager;
