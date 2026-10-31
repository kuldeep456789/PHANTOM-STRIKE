"use strict";
// ============================================================
// Game Constants
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.POINTS = exports.ACTION_GRACE_MS = exports.DISCONNECT_TOLERANCE = exports.ROOM_CODE_LENGTH = exports.MAX_PLAYERS = exports.MIN_PLAYERS = exports.MAX_SUDDEN_DEATH = exports.RESULTS_DURATION = exports.REVEAL_DURATION = exports.ROUND_TIME_LIMIT = exports.MAX_ROUNDS = exports.POINT_TARGET = void 0;
exports.POINT_TARGET = 15; // First to this score wins
exports.MAX_ROUNDS = 10; // Round limit fallback win
exports.ROUND_TIME_LIMIT = 20; // Seconds per action phase
exports.REVEAL_DURATION = 3000; // ms before results shown
exports.RESULTS_DURATION = 5000; // ms results displayed
exports.MAX_SUDDEN_DEATH = 3; // Max sudden death rounds before co-win
exports.MIN_PLAYERS = 2;
exports.MAX_PLAYERS = 8;
exports.ROOM_CODE_LENGTH = 4;
exports.DISCONNECT_TOLERANCE = 2; // Rounds before inactive removal
exports.ACTION_GRACE_MS = 500; // ms after timer for late submissions
// Point deltas
exports.POINTS = {
    STRIKE_HIT: 2, // Striker hits unshielded target
    STRIKE_HIT_TARGET: -2, // Target of successful strike
    STRIKE_BLOCKED: -1, // Striker hits shielded target
    SHIELD_BLOCKED: 1, // Shielder successfully blocks
    SHIELD_IDLE: 1, // Shielded but nobody attacked
    PHANTOM: 1, // Phantom vanish bonus
    MUTUAL_STRIKE: -1, // Both players strike each other
};
