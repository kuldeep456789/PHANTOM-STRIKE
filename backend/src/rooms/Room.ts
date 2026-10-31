// ============================================================
// Room — holds all state for one game room
// ============================================================

import { GameState, Player, PlayerAction } from '../types';
import { createInitialGameState } from '../game/GameState';

export class Room {
  public readonly roomCode: string;
  public state: GameState;

  // Server-only: submitted actions this round (not sent to clients until reveal)
  public pendingActions: Map<string, PlayerAction> = new Map();

  // Disconnect tracking: playerId → consecutive missed rounds
  public missedRounds: Map<string, number> = new Map();

  // Round timer reference
  public roundTimer?: ReturnType<typeof setTimeout>;

  constructor(roomCode: string) {
    this.roomCode = roomCode;
    this.state = createInitialGameState(roomCode);
  }

  get players(): Player[] {
    return this.state.players;
  }

  get connectedPlayers(): Player[] {
    return this.state.players.filter((p) => p.isConnected);
  }

  getPlayer(id: string): Player | undefined {
    return this.state.players.find((p) => p.id === id);
  }

  addPlayer(player: Player): void {
    this.state.players.push(player);
    this.missedRounds.set(player.id, 0);
  }

  removePlayer(id: string): void {
    this.state.players = this.state.players.filter((p) => p.id !== id);
    this.missedRounds.delete(id);
    this.pendingActions.delete(id);
  }

  markDisconnected(id: string): void {
    const p = this.getPlayer(id);
    if (p) p.isConnected = false;
  }

  markConnected(id: string): void {
    const p = this.getPlayer(id);
    if (p) {
      p.isConnected = true;
      this.missedRounds.set(id, 0);
    }
  }

  isAvatarTaken(avatarId: number): boolean {
    return this.state.players.some((p) => p.avatarId === avatarId);
  }

  allConnectedSubmitted(): boolean {
    return this.connectedPlayers.every((p) => p.hasSubmitted);
  }

  resetRoundSubmissions(): void {
    for (const p of this.state.players) {
      p.hasSubmitted = false;
    }
    this.pendingActions.clear();
  }

  clearTimer(): void {
    if (this.roundTimer) {
      clearTimeout(this.roundTimer);
      this.roundTimer = undefined;
    }
  }
}

