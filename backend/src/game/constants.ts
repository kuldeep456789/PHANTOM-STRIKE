// ============================================================
// Game Constants
// ============================================================

export const POINT_TARGET = 15;          // First to this score wins
export const MAX_ROUNDS = 10;            // Round limit fallback win
export const ROUND_TIME_LIMIT = 20;      // Seconds per action phase
export const REVEAL_DURATION = 3000;     // ms before results shown
export const RESULTS_DURATION = 5000;    // ms results displayed
export const MAX_SUDDEN_DEATH = 3;       // Max sudden death rounds before co-win
export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 8;
export const ROOM_CODE_LENGTH = 4;
export const DISCONNECT_TOLERANCE = 2;   // Rounds before inactive removal
export const ACTION_GRACE_MS = 500;      // ms after timer for late submissions

// Point deltas
export const POINTS = {
  STRIKE_HIT: 2,         // Striker hits unshielded target
  STRIKE_HIT_TARGET: -2, // Target of successful strike
  STRIKE_BLOCKED: -1,    // Striker hits shielded target
  SHIELD_BLOCKED: 1,     // Shielder successfully blocks
  SHIELD_IDLE: 1,        // Shielded but nobody attacked
  PHANTOM: 1,            // Phantom vanish bonus
  MUTUAL_STRIKE: -1,     // Both players strike each other
} as const;

