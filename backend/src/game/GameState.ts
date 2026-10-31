// ============================================================
// GameState — server-side mutable model
// ============================================================

import {
  ActionType,
  GamePhase,
  GameState,
  Player,
  PlayerAction,
  PlayerResult,
  RoundResult,
} from '../types';

import {
  MAX_ROUNDS,
  POINT_TARGET,
  ROUND_TIME_LIMIT,
} from './constants';

export function createInitialGameState(roomCode: string): GameState {
  return {
    roomCode,
    phase: 'LOBBY',
    players: [],
    round: 0,
    maxRounds: MAX_ROUNDS,
    pointTarget: POINT_TARGET,
    roundTimeLimit: ROUND_TIME_LIMIT,
    lastRoundResult: undefined,
    winner: undefined,
    suddenDeathCount: 0,
  };
}

/**
 * Return a sanitized, client-safe snapshot of the game state.
 * Strips any server-only fields if needed.
 */
export function toClientState(state: GameState): GameState {
  return {
    ...state,
    players: state.players.map((p) => ({
      ...p,
      hasSubmitted: p.hasSubmitted, // clients see who locked in (not what they picked)
    })),
  };
}

