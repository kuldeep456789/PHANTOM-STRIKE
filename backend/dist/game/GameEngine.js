"use strict";
// ============================================================
// GameEngine — pure action resolution & scoring logic
// Server authoritative. No client involvement.
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveRound = resolveRound;
exports.checkWinCondition = checkWinCondition;
const constants_1 = require("./constants");
// ------------------------------------------------------------------
// Resolve all actions for a round → produce per-player results
// ------------------------------------------------------------------
function resolveRound(round, players, actions) {
    // Build a delta map: playerId → point change
    const deltas = {};
    const resultLabels = {};
    const phantomReveals = {};
    // Initialize all deltas to 0
    for (const p of players) {
        deltas[p.id] = 0;
        resultLabels[p.id] = '';
    }
    // Collect all actions, defaulting to PHANTOM (no bonus) for missing
    const actionMap = {};
    for (const p of players) {
        actionMap[p.id] = actions.get(p.id) ?? {
            playerId: p.id,
            action: 'PHANTOM',
            targetId: undefined,
        };
    }
    // Identify shielding and phantom players
    const shielders = new Set(players.filter((p) => actionMap[p.id].action === 'SHIELD').map((p) => p.id));
    const phantoms = new Set(players.filter((p) => actionMap[p.id].action === 'PHANTOM').map((p) => p.id));
    const strikers = players.filter((p) => actionMap[p.id].action === 'STRIKE');
    // Track shielders that actually blocked at least one attack
    const attackedShielders = new Set();
    // Resolve STRIKEs
    // Track mutual strikes: if A→B and B→A
    const strikeMap = {}; // strikerId → targetId
    for (const striker of strikers) {
        const targetId = actionMap[striker.id].targetId;
        if (targetId)
            strikeMap[striker.id] = targetId;
    }
    const processedStrikes = new Set();
    for (const striker of strikers) {
        const targetId = strikeMap[striker.id];
        if (!targetId || !deltas.hasOwnProperty(targetId))
            continue;
        const strikePairKey = [striker.id, targetId].sort().join(':');
        if (processedStrikes.has(strikePairKey))
            continue;
        // Check mutual strike
        if (strikeMap[targetId] === striker.id) {
            // Mutual strike — both lose 1
            processedStrikes.add(strikePairKey);
            deltas[striker.id] += constants_1.POINTS.MUTUAL_STRIKE;
            deltas[targetId] += constants_1.POINTS.MUTUAL_STRIKE;
            const sName = players.find((p) => p.id === striker.id)?.name ?? '?';
            const tName = players.find((p) => p.id === targetId)?.name ?? '?';
            resultLabels[striker.id] = `Mutual strike with ${tName}! ${constants_1.POINTS.MUTUAL_STRIKE}`;
            resultLabels[targetId] = `Mutual strike with ${sName}! ${constants_1.POINTS.MUTUAL_STRIKE}`;
            continue;
        }
        // Target is a Phantom — strike wasted (striker gets 0)
        if (phantoms.has(targetId)) {
            resultLabels[striker.id] = `Target vanished! +0`;
            continue;
        }
        // Target is shielded — blocks this and all other strikes
        if (shielders.has(targetId)) {
            deltas[striker.id] += constants_1.POINTS.STRIKE_BLOCKED;
            attackedShielders.add(targetId);
            const tName = players.find((p) => p.id === targetId)?.name ?? '?';
            resultLabels[striker.id] = `Blocked by ${tName}! ${constants_1.POINTS.STRIKE_BLOCKED}`;
            continue;
        }
        // Clean hit
        deltas[striker.id] += constants_1.POINTS.STRIKE_HIT;
        deltas[targetId] += constants_1.POINTS.STRIKE_HIT_TARGET;
        const tName = players.find((p) => p.id === targetId)?.name ?? '?';
        resultLabels[striker.id] = `Struck ${tName}! +${constants_1.POINTS.STRIKE_HIT}`;
        resultLabels[targetId] = `Hit by ${players.find((p) => p.id === striker.id)?.name ?? '?'}! ${constants_1.POINTS.STRIKE_HIT_TARGET}`;
    }
    // Resolve shielder rewards
    for (const shielderId of shielders) {
        if (attackedShielders.has(shielderId)) {
            deltas[shielderId] += constants_1.POINTS.SHIELD_BLOCKED;
            resultLabels[shielderId] = `Blocked strike! +${constants_1.POINTS.SHIELD_BLOCKED}`;
        }
        else {
            deltas[shielderId] += constants_1.POINTS.SHIELD_IDLE;
            resultLabels[shielderId] = `Shielded (no attack)! +${constants_1.POINTS.SHIELD_IDLE}`;
        }
    }
    // PHANTOM bonuses + reveals
    const nonPhantomPlayers = players.filter((p) => !phantoms.has(p.id));
    for (const phantomId of phantoms) {
        const hasBonus = actions.has(phantomId); // only real (not auto) phantoms get bonus
        if (hasBonus) {
            deltas[phantomId] += constants_1.POINTS.PHANTOM;
            resultLabels[phantomId] = `Vanished! +${constants_1.POINTS.PHANTOM}`;
        }
        else {
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
    const newScores = {};
    for (const p of players) {
        newScores[p.id] = Math.max(0, p.score + deltas[p.id]);
    }
    // Build results array
    const results = players.map((p) => ({
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
function checkWinCondition(players, round, maxRounds, pointTarget, suddenDeathCount) {
    if (players.length === 0)
        return { over: false };
    const maxScore = Math.max(...players.map((p) => p.score));
    // Point threshold win: at least one player reached or passed target score
    if (maxScore >= pointTarget) {
        const winners = players.filter((p) => p.score === maxScore);
        if (winners.length === 1) {
            return { over: true, suddenDeath: false, winners };
        }
        // Multiple players tied for top score at or above threshold
        if (suddenDeathCount >= constants_1.MAX_SUDDEN_DEATH) {
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
        if (suddenDeathCount >= constants_1.MAX_SUDDEN_DEATH) {
            return { over: true, suddenDeath: false, winners }; // co-win
        }
        return { over: true, suddenDeath: true, tied: winners };
    }
    return { over: false };
}
