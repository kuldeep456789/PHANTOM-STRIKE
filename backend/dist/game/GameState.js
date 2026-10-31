"use strict";
// ============================================================
// GameState — server-side mutable model
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.createInitialGameState = createInitialGameState;
exports.toClientState = toClientState;
const constants_1 = require("./constants");
function createInitialGameState(roomCode) {
    return {
        roomCode,
        phase: 'LOBBY',
        players: [],
        round: 0,
        maxRounds: constants_1.MAX_ROUNDS,
        pointTarget: constants_1.POINT_TARGET,
        roundTimeLimit: constants_1.ROUND_TIME_LIMIT,
        lastRoundResult: undefined,
        winner: undefined,
        suddenDeathCount: 0,
    };
}
/**
 * Return a sanitized, client-safe snapshot of the game state.
 * Strips any server-only fields if needed.
 */
function toClientState(state) {
    return {
        ...state,
        players: state.players.map((p) => ({
            ...p,
            hasSubmitted: p.hasSubmitted, // clients see who locked in (not what they picked)
        })),
    };
}
