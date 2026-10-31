// ============================================================
// PHANTOM STRIKE — Shared Types
// Used by both frontend and backend
// ============================================================

export type ActionType = 'STRIKE' | 'SHIELD' | 'PHANTOM';

export type GamePhase =
  | 'LOBBY'
  | 'ACTION'
  | 'WAITING'
  | 'REVEAL'
  | 'RESULTS'
  | 'SUDDEN_DEATH'
  | 'GAME_OVER';

// ------------------------------------------------------------------
// Player
// ------------------------------------------------------------------
export interface Player {
  id: string;
  name: string;
  avatarId: number;       // 0–7 maps to one of 8 operatives
  score: number;
  isHost: boolean;
  isConnected: boolean;
  hasSubmitted: boolean;  // current round only — reset each round
}

// ------------------------------------------------------------------
// Action submitted by a player for a round
// ------------------------------------------------------------------
export interface PlayerAction {
  playerId: string;
  action: ActionType;
  targetId?: string;      // required for STRIKE, absent for SHIELD/PHANTOM
}

// ------------------------------------------------------------------
// Per-player outcome after resolution
// ------------------------------------------------------------------
export interface PlayerResult {
  playerId: string;
  action: ActionType;
  targetId?: string;
  pointDelta: number;     // + or - change this round
  newScore: number;
  resultLabel: string;    // e.g. "Struck Cipher! +2", "Shielded! +1"
  phantomReveal?: {       // only for PHANTOM players
    revealedPlayerId: string;
    revealedAction: ActionType;
  };
}

// ------------------------------------------------------------------
// Full round result (sent after reveal)
// ------------------------------------------------------------------
export interface RoundResult {
  round: number;
  results: PlayerResult[];
  scores: Record<string, number>;  // playerId → score
}

// ------------------------------------------------------------------
// Game state (authoritative, server-owned)
// ------------------------------------------------------------------
export interface GameState {
  roomCode: string;
  phase: GamePhase;
  players: Player[];
  round: number;
  maxRounds: number;
  pointTarget: number;
  roundTimeLimit: number;         // seconds
  roundStartedAt?: number;        // Unix ms timestamp
  lastRoundResult?: RoundResult;
  winner?: Player | Player[];     // single or co-winners
  suddenDeathCount: number;
}

// ------------------------------------------------------------------
// Socket event payloads — Client → Server
// ------------------------------------------------------------------
export interface CreateRoomPayload {
  playerName: string;
  avatarId: number;
}

export interface JoinRoomPayload {
  roomCode: string;
  playerName: string;
  avatarId: number;
}

export interface StartGamePayload {
  roomCode: string;
}

export interface SubmitActionPayload {
  roomCode: string;
  action: ActionType;
  targetId?: string;
}

export interface PlayAgainPayload {
  roomCode: string;
}

export interface KickPlayerPayload {
  roomCode: string;
  targetPlayerId: string;
}

// ------------------------------------------------------------------
// Socket event payloads — Server → Client
// ------------------------------------------------------------------
export interface RoomJoinedPayload {
  roomCode: string;
  playerId: string;
  gameState: GameState;
}

export interface ErrorPayload {
  message: string;
}

// ------------------------------------------------------------------
// Avatar metadata (used by frontend only)
// ------------------------------------------------------------------
export interface AvatarMeta {
  id: number;
  name: string;
  title: string;
  glowColor: string;    // Tailwind color class or hex
  accentHex: string;
}

export const AVATARS: AvatarMeta[] = [
  { id: 0, name: 'Cipher',  title: 'The Hacker',   glowColor: 'cyan',    accentHex: '#22d3ee' },
  { id: 1, name: 'Vex',     title: 'The Spy',      glowColor: 'purple',  accentHex: '#a855f7' },
  { id: 2, name: 'Nyx',     title: 'The Rogue',    glowColor: 'red',     accentHex: '#ef4444' },
  { id: 3, name: 'Kael',    title: 'The Rebel',    glowColor: 'blue',    accentHex: '#3b82f6' },
  { id: 4, name: 'Iris',    title: 'The Wildcard', glowColor: 'green',   accentHex: '#22c55e' },
  { id: 5, name: 'Dusk',    title: 'The Knight',   glowColor: 'yellow',  accentHex: '#eab308' },
  { id: 6, name: 'Auryn',   title: 'The Gambler',  glowColor: 'pink',    accentHex: '#ec4899' },
  { id: 7, name: 'Sable',   title: 'The Phantom',  glowColor: 'indigo',  accentHex: '#6366f1' },
];

