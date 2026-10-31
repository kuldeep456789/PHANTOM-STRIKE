// ============================================================
// RoomManager — creates, finds, and destroys rooms
// ============================================================

import { Room } from './Room';
import { ROOM_CODE_LENGTH, MAX_PLAYERS } from '../game/constants';

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // omit I/O to avoid confusion

export class RoomManager {
  private rooms: Map<string, Room> = new Map();

  // ------------------------------------------------------------------
  createRoom(): Room {
    let code: string;
    do {
      code = Array.from({ length: ROOM_CODE_LENGTH }, () =>
        CHARS[Math.floor(Math.random() * CHARS.length)]
      ).join('');
    } while (this.rooms.has(code));

    const room = new Room(code);
    this.rooms.set(code, room);
    return room;
  }

  // ------------------------------------------------------------------
  getRoom(code: string): Room | undefined {
    return this.rooms.get(code.toUpperCase());
  }

  // ------------------------------------------------------------------
  destroyRoom(code: string): void {
    const room = this.rooms.get(code);
    if (room) {
      room.clearTimer();
      this.rooms.delete(code);
    }
  }

  // ------------------------------------------------------------------
  canJoin(code: string): { ok: true; room: Room } | { ok: false; reason: string } {
    const room = this.getRoom(code);
    if (!room) return { ok: false, reason: 'Room not found. Check the code and try again.' };
    if (room.state.phase !== 'LOBBY') return { ok: false, reason: 'Game already in progress.' };
    if (room.players.length >= MAX_PLAYERS) return { ok: false, reason: 'Room is full (8/8).' };
    return { ok: true, room };
  }

  // ------------------------------------------------------------------
  getRoomByPlayerId(playerId: string): Room | undefined {
    for (const room of this.rooms.values()) {
      if (room.getPlayer(playerId)) return room;
    }
    return undefined;
  }

  // ------------------------------------------------------------------
  /** Schedule room destruction after timeout if empty */
  scheduleDestroy(code: string, delayMs = 60_000): void {
    setTimeout(() => {
      const room = this.getRoom(code);
      if (room && room.connectedPlayers.length === 0) {
        this.destroyRoom(code);
        console.log(`[RoomManager] Destroyed empty room ${code}`);
      }
    }, delayMs);
  }
}

