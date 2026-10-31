'use client';
// ============================================================
// Lobby Page — players gather before game starts
// ============================================================
import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSocket } from '@/hooks/useSocket';
import { useGameState } from '@/hooks/useGameState';
import GlassPanel from '@/components/layout/GlassPanel';
import LobbyPlayerList from '@/components/lobby/LobbyPlayerList';
import ErrorToast from '@/components/ui/ErrorToast';

export default function LobbyPage() {
  const params  = useParams();
  const router  = useRouter();
  const roomCode = (params.roomCode as string)?.toUpperCase();

  const { emit } = useSocket();
  const { gameState, myPlayer, playerId, error, clearError } = useGameState();

  // Navigate to game when phase changes
  useEffect(() => {
    if (gameState?.phase && gameState.phase !== 'LOBBY') {
      router.push(`/game/${roomCode}`);
    }
  }, [gameState?.phase, roomCode, router]);

  // If no game state, redirect home (e.g. page refresh)
  useEffect(() => {
    if (!gameState && !playerId) {
      router.push('/');
    }
  }, [gameState, playerId, router]);

  if (!gameState || !myPlayer) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white/50 animate-pulse">Connecting to room...</div>
      </div>
    );
  }

  const isHost = myPlayer.isHost;
  const playerCount = gameState.players.length;
  const canStart = playerCount >= 2;

  function handleStart() {
    emit('start_game', { roomCode });
  }

  function handleKick(targetId: string) {
    emit('kick_player', { roomCode, targetPlayerId: targetId });
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 gap-6">
      {error && <ErrorToast message={error} onClose={clearError} />}

      {/* Room code display */}
      <div className="text-center animate-slide-up">
        <p className="text-white/40 text-sm uppercase tracking-widest mb-2">Room Code</p>
        <div className="room-code">{roomCode}</div>
        <p className="text-white/30 text-xs mt-2">Share this code with your friends</p>
      </div>

      {/* Player list */}
      <GlassPanel className="w-full max-w-lg animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">
            Operatives{' '}
            <span className="text-white/40 text-base font-normal">({playerCount}/8)</span>
          </h2>
          <div className="flex gap-1">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  i < playerCount ? 'bg-indigo-500' : 'bg-white/10'
                }`}
              />
            ))}
          </div>
        </div>

        <LobbyPlayerList
          players={gameState.players}
          myId={playerId ?? ''}
          isHost={isHost}
          onKick={handleKick}
        />
      </GlassPanel>

      {/* Host controls */}
      <div className="w-full max-w-lg space-y-3 animate-slide-up">
        {isHost ? (
          <>
            <button
              className="btn-primary w-full text-lg py-4"
              onClick={handleStart}
              disabled={!canStart}
            >
              {canStart ? '🚀 Start Game' : `⏳ Waiting for players (${playerCount}/2 min)`}
            </button>
            {!canStart && (
              <p className="text-center text-white/30 text-sm">
                Need at least 2 players to start
              </p>
            )}
          </>
        ) : (
          <GlassPanel className="text-center py-4">
            <p className="text-white/50 animate-pulse">
              ⏳ Waiting for host to start the game...
            </p>
          </GlassPanel>
        )}
      </div>

      {/* How to play — quick reference */}
      <GlassPanel className="w-full max-w-lg animate-slide-up">
        <h3 className="text-sm font-bold text-white/60 uppercase tracking-wider mb-3">
          How to Play
        </h3>
        <div className="grid grid-cols-3 gap-3 text-center">
          {[
            { icon: '⚔️', action: 'STRIKE', desc: 'Attack a player. Hit = steal points.' },
            { icon: '🛡️', action: 'SHIELD', desc: 'Block attacks. Earn 1 pt if idle.' },
            { icon: '👻', action: 'PHANTOM', desc: 'Vanish. Untouchable. +1 pt + intel.' },
          ].map((a) => (
            <div key={a.action} className="glass rounded-xl p-3">
              <div className="text-2xl mb-1">{a.icon}</div>
              <div className="text-xs font-bold text-white/80 mb-1">{a.action}</div>
              <div className="text-xs text-white/40 leading-relaxed">{a.desc}</div>
            </div>
          ))}
        </div>
        <p className="text-center text-white/30 text-xs mt-3">
          First to 15 pts wins · Or highest after 10 rounds
        </p>
      </GlassPanel>
    </main>
  );
}
