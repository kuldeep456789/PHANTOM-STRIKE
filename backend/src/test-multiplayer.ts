import http from 'http';
import express from 'express';
import { Server } from 'socket.io';
import { io as ClientSocket, Socket as ClientSocketType } from 'socket.io-client';
import { RoomManager } from './rooms/RoomManager';
import { registerHandlers } from './socket/handlers';
import { GameState, RoundResult, Player } from './types';

interface TestResult {
  num: number;
  description: string;
  status: 'PASS' | 'FAIL';
  details?: string;
}

const results: TestResult[] = [];

function record(num: number, description: string, pass: boolean, details?: string) {
  const status = pass ? 'PASS' : 'FAIL';
  results.push({ num, description, status, details });
  console.log(`[TEST ${num}] ${status}: ${description}${details ? ' - ' + details : ''}`);
}

async function runTests() {
  const HOST = '127.0.0.1';
  const app = express();
  const httpServer = http.createServer(app);
  const io = new Server(httpServer, {
    cors: { origin: '*' },
    transports: ['polling', 'websocket'],
  });
  const roomManager = new RoomManager();

  io.on('connection', (socket) => {
    registerHandlers(io, socket, roomManager);
  });

  await new Promise<void>((resolve) => httpServer.listen(0, HOST, resolve));
  const addr = httpServer.address() as { port: number; address: string };
  const PORT = addr.port;
  console.log(`Test Server running on http://${HOST}:${PORT}`);

  const SERVER_URL = `http://${HOST}:${PORT}`;

  function createClient(): ClientSocketType {
    return ClientSocket(SERVER_URL, {
      transports: ['polling', 'websocket'],
      forceNew: true,
      reconnection: false,
    });
  }

  const p1 = createClient();
  const p2 = createClient();

  p1.on('connect_error', (err) => console.error('P1 connect error:', err));
  p2.on('connect_error', (err) => console.error('P2 connect error:', err));

  await Promise.all([
    new Promise<void>((res) => p1.on('connect', () => { console.log('P1 connected'); res(); })),
    new Promise<void>((res) => p2.on('connect', () => { console.log('P2 connected'); res(); })),
  ]);

  let roomCode = '';
  let p1Id = '';
  let p2Id = '';
  let p1State: any = null;
  let p2State: any = null;

  p1.on('state_update', (st: any) => { p1State = st; });
  p2.on('state_update', (st: any) => { p2State = st; });

  try {
    // -------------------------------------------------------------
    // Test 1: Player 1 creates a room
    // -------------------------------------------------------------
    await new Promise<void>((resolve, reject) => {
      p1.emit('create_room', { playerName: 'Operative Alice', avatarId: 0 });
      p1.on('room_joined', (data: any) => {
        roomCode = data.roomCode;
        p1Id = data.playerId;
        p1State = data.gameState;
        resolve();
      });
      p1.on('error', (err: any) => reject(new Error(err.message)));
    });

    record(1, 'Player 1 creates a room', !!roomCode && p1State?.players.length === 1, `Room: ${roomCode}`);

    // -------------------------------------------------------------
    // Test 2: Player 2 joins using the room code
    // -------------------------------------------------------------
    await new Promise<void>((resolve, reject) => {
      p2.emit('join_room', { roomCode, playerName: 'Operative Bob', avatarId: 1 });
      p2.on('room_joined', (data: any) => {
        p2Id = data.playerId;
        p2State = data.gameState;
        resolve();
      });
      p2.on('error', (err: any) => reject(new Error(err.message)));
    });

    record(2, 'Player 2 joins using the room code', !!p2Id && p2State?.roomCode === roomCode);

    // -------------------------------------------------------------
    // Test 3: Both players see the same lobby roster
    // -------------------------------------------------------------
    await new Promise((r) => setTimeout(r, 100)); // wait for broadcast
    const rosterMatch = p1State?.players?.length === 2 &&
      p2State?.players?.length === 2 &&
      p1State.players.some((p: any) => p.name === 'Operative Alice') &&
      p2State.players.some((p: any) => p.name === 'Operative Bob');

    record(3, 'Both players see the same lobby roster', rosterMatch, `P1 count: ${p1State?.players?.length}, P2 count: ${p2State?.players?.length}`);

    // -------------------------------------------------------------
    // Test 4: The host starts the game
    // -------------------------------------------------------------
    await new Promise<void>((resolve) => {
      p1.emit('start_game', { roomCode });
      const check = setInterval(() => {
        if (p1State?.phase === 'ACTION' && p2State?.phase === 'ACTION') {
          clearInterval(check);
          resolve();
        }
      }, 50);
    });

    record(4, 'The host starts the game', p1State?.phase === 'ACTION' && p2State?.phase === 'ACTION', `Round: ${p1State?.round}`);

    // -------------------------------------------------------------
    // Test 5: Each player submits a secret action
    // Test 6: A player's action remains hidden from opponents until reveal
    // -------------------------------------------------------------
    const stateUpdatesDuringAction: any[] = [];
    const p2Listener = (st: any) => {
      stateUpdatesDuringAction.push(JSON.parse(JSON.stringify(st)));
    };
    p2.on('state_update', p2Listener);

    // Player 1 locks in STRIKE against Player 2
    p1.emit('submit_action', { roomCode, action: 'STRIKE', targetId: p2Id });

    await new Promise((r) => setTimeout(r, 150));

    // In our protocol: Player object only contains hasSubmitted: boolean, no 'action' or 'targetId'
    const leaksAction = stateUpdatesDuringAction.some((st) => {
      return st.players?.some((p: any) => p.action !== undefined || p.targetId !== undefined);
    });

    record(5, 'Each player submits a secret action', p1State?.players.find((p: any) => p.id === p1Id)?.hasSubmitted === true);
    record(6, "A player's action remains hidden from opponents until reveal", !leaksAction, 'Confirmed state_update carries only hasSubmitted: boolean');

    p2.off('state_update', p2Listener);

    // -------------------------------------------------------------
    // Test 7: Duplicate submissions ignored; round resolves once
    // -------------------------------------------------------------
    p1.emit('submit_action', { roomCode, action: 'SHIELD' }); // Should be ignored

    let p1Reveals = 0;
    let p2Reveals = 0;
    let revealPayload: any = null;

    p1.on('round_revealed', (res: any) => {
      p1Reveals++;
      revealPayload = res;
    });
    p2.on('round_revealed', () => {
      p2Reveals++;
    });

    // P2 submits SHIELD
    p2.emit('submit_action', { roomCode, action: 'SHIELD' });

    // Wait for reveal + results transition
    await new Promise<void>((resolve) => {
      const wait = setInterval(() => {
        if (p1Reveals > 0 && p2Reveals > 0) {
          clearInterval(wait);
          resolve();
        }
      }, 50);
    });

    // P1 did STRIKE on P2, P2 did SHIELD.
    // Expected: P1 blocked (-1 pt, but score floor 0 -> 0), P2 blocked strike (+1 pt)
    record(7, 'The round resolves once, even if duplicate submissions occur', p1Reveals === 1 && p2Reveals === 1, `Reveals: P1=${p1Reveals}, P2=${p2Reveals}`);

    // -------------------------------------------------------------
    // Test 8: All players receive consistent round results and scores
    // -------------------------------------------------------------
    const p1Result = revealPayload?.results.find((r: any) => r.playerId === p1Id);
    const p2Result = revealPayload?.results.find((r: any) => r.playerId === p2Id);
    const consistentScores = p1Result?.newScore === 0 && p2Result?.newScore === 1 &&
      revealPayload?.scores[p1Id] === 0 && revealPayload?.scores[p2Id] === 1;

    record(8, 'All players receive consistent round results and scores', !!consistentScores, `P1 score: ${p1Result?.newScore}, P2 score: ${p2Result?.newScore}`);

    // -------------------------------------------------------------
    // Test 9: The game advances correctly through subsequent rounds
    // -------------------------------------------------------------
    console.log('Waiting for reveal (3s) + results phase (5s) to advance to Round 2...');
    await new Promise<void>((resolve) => {
      const checkR2 = setInterval(() => {
        if (p1State?.round === 2 && p1State?.phase === 'ACTION') {
          clearInterval(checkR2);
          resolve();
        }
      }, 200);
    });

    record(9, 'The game advances correctly through subsequent rounds', p1State?.round === 2 && p1State?.phase === 'ACTION', `Now in Round 2, phase: ${p1State?.phase}`);

    // -------------------------------------------------------------
    // Test 10: Winner declared according to rules (first to 15 or highest after 10)
    // -------------------------------------------------------------
    const { checkWinCondition } = await import('./game/GameEngine');
    const mockPlayers: Player[] = [
      { id: 'a', name: 'A', avatarId: 0, score: 15, isHost: true, isConnected: true, hasSubmitted: false },
      { id: 'b', name: 'B', avatarId: 1, score: 10, isHost: false, isConnected: true, hasSubmitted: false },
    ];
    const win1 = checkWinCondition(mockPlayers, 3, 10, 15, 0);

    const mockTied: Player[] = [
      { id: 'a', name: 'A', avatarId: 0, score: 16, isHost: true, isConnected: true, hasSubmitted: false },
      { id: 'b', name: 'B', avatarId: 1, score: 16, isHost: false, isConnected: true, hasSubmitted: false },
    ];
    const winTie = checkWinCondition(mockTied, 3, 10, 15, 0);
    const winCoWin = checkWinCondition(mockTied, 3, 10, 15, 3); // after 3 sudden deaths

    const winRulesPassed = win1.over && !win1.suddenDeath && (win1 as any).winners[0].id === 'a' &&
      winTie.over && winTie.suddenDeath &&
      winCoWin.over && !winCoWin.suddenDeath && (winCoWin as any).winners.length === 2;

    record(10, 'The correct winner is declared (15 pts, round limit, sudden-death tiebreaker)', winRulesPassed, 'Validated threshold win, sudden death tie, and 3-round co-win limit');

    // -------------------------------------------------------------
    // Test 11: Play Again resets the game correctly
    // -------------------------------------------------------------
    const currentRoom = roomManager.getRoom(roomCode);
    if (currentRoom) {
      currentRoom.state.phase = 'GAME_OVER';
      currentRoom.state.winner = currentRoom.players[1];
    }
    p1.emit('play_again', { roomCode });

    await new Promise((r) => setTimeout(r, 200));

    const resetPassed = p1State?.phase === 'LOBBY' &&
      p1State.round === 0 &&
      p1State.players.every((p: any) => p.score === 0);

    record(11, 'Play Again resets the game correctly', resetPassed, `Phase: ${p1State?.phase}, Round: ${p1State?.round}, Scores: ${p1State?.players.map((p: any) => p.score).join(',')}`);

    // -------------------------------------------------------------
    // Test 12: Disconnects and invalid actions do not leave room stuck
    // -------------------------------------------------------------
    p1.emit('start_game', { roomCode });
    await new Promise((r) => setTimeout(r, 200));

    let errorReceived = '';
    p1.once('error', (err: any) => { errorReceived = err.message; });
    p1.emit('submit_action', { roomCode, action: 'STRIKE', targetId: p1Id }); // target self
    await new Promise((r) => setTimeout(r, 100));

    const invalidActionRejected = !!errorReceived;

    p2.disconnect();
    await new Promise((r) => setTimeout(r, 300));

    p1.emit('submit_action', { roomCode, action: 'PHANTOM' });

    let roundResolvedAfterDisconnect = false;
    p1.once('round_revealed', () => {
      roundResolvedAfterDisconnect = true;
    });

    await new Promise<void>((resolve) => {
      const check = setInterval(() => {
        if (roundResolvedAfterDisconnect || p1State?.phase === 'REVEAL' || p1State?.phase === 'RESULTS') {
          clearInterval(check);
          resolve();
        }
      }, 100);
    });

    record(12, 'Disconnects and invalid actions do not leave room stuck', invalidActionRejected && (roundResolvedAfterDisconnect || p1State?.phase === 'REVEAL' || p1State?.phase === 'RESULTS'), `Self-target rejected: "${errorReceived}", Round progressed after disconnect: ${roundResolvedAfterDisconnect}`);

  } catch (err: any) {
    console.error('Test execution error:', err);
  } finally {
    try { p1.disconnect(); } catch (_) {}
    try { p2.disconnect(); } catch (_) {}
    try { io.close(); } catch (_) {}
    try { httpServer.close(); } catch (_) {}
  }

  console.log('\n========================================');
  console.log('         TEST SUMMARY REPORT            ');
  console.log('========================================');
  let passCount = 0;
  for (const r of results) {
    console.log(`[${r.status}] #${r.num} ${r.description}`);
    if (r.status === 'PASS') passCount++;
  }
  console.log(`\nTOTAL: ${passCount} / ${results.length} PASSED`);

  const allPassed = passCount === results.length && results.length > 0;
  process.exit(allPassed ? 0 : 1);
}

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
