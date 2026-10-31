// ============================================================
// GameEngine — pure action resolution & scoring logic
// Server authoritative. No client involvement.
// ============================================================

import {
  ActionType,
  Player,
  PlayerAction,
  PlayerResult,
  RoundResult,
} from '../types';

import {
  POINTS,
  MAX_SUDDEN_DEATH,
  POINT_TARGET,
  MAX_ROUNDS,
} from './constants';

// ------------------------------------------------------------------
// Resolve all actions for a round → produce per-player results
// ------------------------------------------------------------------
export function resolveRound(
  round: number,
  players: Player[],
  actions: Map<string, PlayerAction>
): RoundResult {
  // Build a delta map: playerId → point change
  const deltas: Record<string, number> = {};
  const resultLabels: Record<string, string> = {};
  const phantomReveals: Record<string, { revealedPlayerId: string; revealedAction: ActionType }> = {};

  // Initialize all deltas to 0
  for (const p of players) {
    deltas[p.id] = 0;
    resultLabels[p.id] = '';
  }

  // Collect all actions, defaulting to PHANTOM (no bonus) for missing
  const actionMap: Record<string, PlayerAction> = {};
  for (const p of players) {
    actionMap[p.id] = actions.get(p.id) ?? {
      playerId: p.id,
      action: 'PHANTOM',
      targetId: undefined,
    };
  }

  // Identify shielding and phantom players
  const shielders = new Set(
    players.filter((p) => actionMap[p.id].action === 'SHIELD').map((p) => p.id)
  );
  const phantoms = new Set(
    players.filter((p) => actionMap[p.id].action === 'PHANTOM').map((p) => p.id)
  );
  const strikers = players.filter((p) => actionMap[p.id].action === 'STRIKE');

  // Track shielders that actually blocked at least one attack
  const attackedShielders = new Set<string>();

  // Resolve STRIKEs
  // Track mutual strikes: if A→B and B→A
  const strikeMap: Record<string, string> = {}; // strikerId → targetId
  for (const striker of strikers) {
    const targetId = actionMap[striker.id].targetId;
    if (targetId) strikeMap[striker.id] = targetId;
  }

  const processedStrikes = new Set<string>();

  for (const striker of strikers) {
    const targetId = strikeMap[striker.id];
    if (!targetId || !deltas.hasOwnProperty(targetId)) continue;

    const strikePairKey = [striker.id, targetId].sort().join(':');
    if (processedStrikes.has(strikePairKey)) continue;

    // Check mutual strike
    if (strikeMap[targetId] === striker.id) {
      // Mutual strike — both lose 1
      processedStrikes.add(strikePairKey);
      deltas[striker.id] += POINTS.MUTUAL_STRIKE;
      deltas[targetId] += POINTS.MUTUAL_STRIKE;
      const sName = players.find((p) => p.id === striker.id)?.name ?? '?';
      const tName = players.find((p) => p.id === targetId)?.name ?? '?';
      resultLabels[striker.id] = `Mutual strike with ${tName}! ${POINTS.MUTUAL_STRIKE}`;
      resultLabels[targetId] = `Mutual strike with ${sName}! ${POINTS.MUTUAL_STRIKE}`;
      continue;
    }

    // Target is a Phantom — strike wasted (striker gets 0)
    if (phantoms.has(targetId)) {
      resultLabels[striker.id] = `Target vanished! +0`;
      continue;
    }

    // Target is shielded — blocks this and all other strikes
    if (shielders.has(targetId)) {
      deltas[striker.id] += POINTS.STRIKE_BLOCKED;
      attackedShielders.add(targetId);
      const tName = players.find((p) => p.id === targetId)?.name ?? '?';
      resultLabels[striker.id] = `Blocked by ${tName}! ${POINTS.STRIKE_BLOCKED}`;
      continue;
    }

    // Clean hit
    deltas[striker.id] += POINTS.STRIKE_HIT;
    deltas[targetId] += POINTS.STRIKE_HIT_TARGET;
    const tName = players.find((p) => p.id === targetId)?.name ?? '?';
    resultLabels[striker.id] = `Struck ${tName}! +${POINTS.STRIKE_HIT}`;
    resultLabels[targetId] = `Hit by ${players.find((p) => p.id === striker.id)?.name ?? '?'}! ${POINTS.STRIKE_HIT_TARGET}`;
  }

  // Resolve shielder rewards
  for (const shielderId of shielders) {
    if (attackedShielders.has(shielderId)) {
      deltas[shielderId] += POINTS.SHIELD_BLOCKED;
      resultLabels[shielderId] = `Blocked strike! +${POINTS.SHIELD_BLOCKED}`;
    } else {
      deltas[shielderId] += POINTS.SHIELD_IDLE;
      resultLabels[shielderId] = `Shielded (no attack)! +${POINTS.SHIELD_IDLE}`;
    }
  }

  // PHANTOM bonuses + reveals
  const nonPhantomPlayers = players.filter((p) => !phantoms.has(p.id));
  for (const phantomId of phantoms) {
    const hasBonus = actions.has(phantomId); // only real (not auto) phantoms get bonus
    if (hasBonus) {
      deltas[phantomId] += POINTS.PHANTOM;
      resultLabels[phantomId] = `Vanished! +${POINTS.PHANTOM}`;
    } else {
      resultLabels[phantomId] = `Timed out — auto phantom. +0`;
    }

    // Phantom reveal: pick one random non-phantom player's action
    if (nonPhantomPlayers.length > 0) {
      const target = nonPhantomPlayers[Math.floor(Math.random() * nonPhantomPlayers.length)];
      phantomReveals[phantomId] = {
        revealedPlayerId: target.id,
        revealedAction: actionMap[target.id].action,
      };
    }
  }

  // Build new scores (floor at 0)
  const newScores: Record<string, number> = {};
  for (const p of players) {
    newScores[p.id] = Math.max(0, p.score + deltas[p.id]);
  }

  // Build results array
  const results: PlayerResult[] = players.map((p) => ({
    playerId: p.id,
    action: actionMap[p.id].action,
    targetId: actionMap[p.id].targetId,
    pointDelta: deltas[p.id],
    newScore: newScores[p.id],
    resultLabel: resultLabels[p.id] || '+0',
    phantomReveal: phantomReveals[p.id],
  }));

  return {
    round,
    results,
    scores: newScores,
  };
}

// ------------------------------------------------------------------
// Check if the game is over after a round
// ------------------------------------------------------------------
export type WinCheckResult =
  | { over: false }
  | { over: true; suddenDeath: false; winners: Player[] }
  | { over: true; suddenDeath: true; tied: Player[] };

export function checkWinCondition(
  players: Player[],
  round: number,
  maxRounds: number,
  pointTarget: number,
  suddenDeathCount: number
): WinCheckResult {
  if (players.length === 0) return { over: false };

  const maxScore = Math.max(...players.map((p) => p.score));

  // Point threshold win: at least one player reached or passed target score
  if (maxScore >= pointTarget) {
    const winners = players.filter((p) => p.score === maxScore);
    if (winners.length === 1) {
      return { over: true, suddenDeath: false, winners };
    }
    // Multiple players tied for top score at or above threshold
    if (suddenDeathCount >= MAX_SUDDEN_DEATH) {
      return { over: true, suddenDeath: false, winners }; // co-win
    }
    return { over: true, suddenDeath: true, tied: winners };
  }

  // Round limit reached
  if (round >= maxRounds) {
    const winners = players.filter((p) => p.score === maxScore);
    if (winners.length === 1) {
      return { over: true, suddenDeath: false, winners };
    }
    // Tied at round limit
    if (suddenDeathCount >= MAX_SUDDEN_DEATH) {
      return { over: true, suddenDeath: false, winners }; // co-win
    }
    return { over: true, suddenDeath: true, tied: winners };
  }

  return { over: false };
}

