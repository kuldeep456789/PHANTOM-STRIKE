'use client';

import { useSyncExternalStore, useCallback } from 'react';
import { getSocket } from '@/lib/socket';
import { GameState, RoundResult, Player } from '@/lib/types';

export interface GameStore {
  gameState: GameState | null;
  playerId: string | null;
  roomCode: string | null;
  lastRoundResult: RoundResult | null;
  error: string | null;
}

let currentStore: GameStore = {
  gameState: null,
  playerId: null,
  roomCode: null,
  lastRoundResult: null,
  error: null,
};

const listeners = new Set<() => void>();

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

let socketInitialized = false;

function initSocketEvents() {
  if (typeof window === 'undefined' || socketInitialized) return;
  socketInitialized = true;

  const socket = getSocket();
  if (!socket.connected) socket.connect();

  socket.on('connect', () => {
    currentStore = {
      ...currentStore,
      playerId: socket.id || currentStore.playerId,
    };
    emitChange();
  });

  socket.on('room_joined', (payload: { roomCode: string; playerId: string; gameState: GameState }) => {
    currentStore = {
      ...currentStore,
      roomCode: payload.roomCode,
      playerId: payload.playerId,
      gameState: payload.gameState,
      error: null,
    };
    emitChange();
  });

  socket.on('state_update', (gameState: GameState) => {
    currentStore = {
      ...currentStore,
      gameState,
      roomCode: gameState.roomCode || currentStore.roomCode,
    };
    emitChange();
  });

  socket.on('round_revealed', (result: RoundResult) => {
    currentStore = {
      ...currentStore,
      lastRoundResult: result,
    };
    emitChange();
  });

  socket.on('game_over', (payload: { winner: Player | Player[]; finalScores: Record<string, number> }) => {
    if (currentStore.gameState) {
      currentStore = {
        ...currentStore,
        gameState: {
          ...currentStore.gameState,
          phase: 'GAME_OVER',
          winner: payload.winner,
        },
      };
      emitChange();
    }
  });

  socket.on('error', (payload: { message: string }) => {
    currentStore = {
      ...currentStore,
      error: payload.message,
    };
    emitChange();
    setTimeout(() => {
      if (currentStore.error === payload.message) {
        currentStore = { ...currentStore, error: null };
        emitChange();
      }
    }, 4000);
  });
}

function subscribe(callback: () => void) {
  initSocketEvents();
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

function getSnapshot(): GameStore {
  return currentStore;
}

const serverSnapshot: GameStore = {
  gameState: null,
  playerId: null,
  roomCode: null,
  lastRoundResult: null,
  error: null,
};

export function useGameState() {
  const store = useSyncExternalStore(subscribe, getSnapshot, () => serverSnapshot);

  const clearError = useCallback(() => {
    currentStore = { ...currentStore, error: null };
    emitChange();
  }, []);

  const myPlayer = store.gameState?.players.find((p) => p.id === store.playerId) ?? null;

  return { ...store, myPlayer, clearError };
}
