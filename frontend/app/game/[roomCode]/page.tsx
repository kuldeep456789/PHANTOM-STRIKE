'use client';
// ============================================================
// Game Page — all active game phases rendered here
// ACTION → REVEAL → RESULTS → GAME_OVER
// ============================================================
import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSocket } from '@/hooks/useSocket';
import { useGameState } from '@/hooks/useGameState';
import { ActionType } from '@/lib/types';
import GlassPanel from '@/components/layout/GlassPanel';
import ActionPanel from '@/components/game/ActionPanel';
import RevealCard from '@/components/game/RevealCard';
import Scoreboard from '@/components/game/Scoreboard';
import CountdownTimer from '@/components/ui/CountdownTimer';
import AvatarCard from '@/components/ui/AvatarCard';
import ErrorToast from '@/components/ui/ErrorToast';

export default function GamePage() {
  const params   = useParams();
  const router   = useRouter();
  const roomCode = (params.roomCode as string)?.toUpperCase();

  const { emit } = useSocket();
  const { gameState, myPlayer, playerId, lastRoundResult, error, clearError } = useGameState();

  // Guard: redirect home if no state
  useEffect(() => {
    if (!gameState || !playerId) router.push('/');
  }, [gameState, playerId, router]);

  // Navigate back to lobby when phase resets (e.g. Play Again)
  useEffect(() => {
    if (gameState?.phase === 'LOBBY') {
      router.push(`/lobby/${roomCode}`);
    }
  }, [gameState?.phase, roomCode, router]);

  if (!gameState || !myPlayer) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-white/40 animate-pulse">Loading game...</p>
      </div>
    );
  }

  const { phase, players, round, maxRounds, pointTarget, roundStartedAt, roundTimeLimit } = gameState;

  function submitAction(action: ActionType, targetId?: string) {
    emit('submit_action', { roomCode, action, targetId });
  }

  function handlePlayAgain() {
    emit('play_again', { roomCode });
    router.push(`/lobby/${roomCode}`);
  }

  // ── ACTION PHASE ──────────────────────────────────────────
  if (phase === 'ACTION' || phase === 'SUDDEN_DEATH') {
    const isSuddenDeath = phase === 'SUDDEN_DEATH';

    return (
      <main className="min-h-screen flex flex-col p-4 gap-4 max-w-2xl mx-auto">
        {error && <ErrorToast message={error} onClose={clearError} />}

        {/* Header */}
        <div className="flex items-center justify-between pt-4">
          <div>
            {isSuddenDeath ? (
              <span className="text-yellow-400 font-black text-lg animate-pulse">
                ⚡ SUDDEN DEATH
              </span>
            ) : (
              <span className="text-white/50 font-medium">
                Round <span className="text-white font-black">{round}</span>
                <span className="text-white/30"> / {maxRounds}</span>
              </span>
            )}
          </div>

          {roundStartedAt && (
            <CountdownTimer
              totalSeconds={roundTimeLimit}
              startedAt={roundStartedAt}
            />
          )}
        </div>

        {/* Who has submitted (privacy: shows locked, not action) */}
        <GlassPanel className="!py-3">
          <div className="flex items-center gap-3 flex-wrap">
            {players.map((p) => (
              <div key={p.id} className="flex flex-col items-center gap-1">
                <AvatarCard
                  avatarId={p.avatarId}
                  size={36}
                  isSubmitted={p.hasSubmitted}
                />
                <span className="text-xs text-white/40 truncate max-w-[48px]">{p.name}</span>
              </div>
            ))}
          </div>
        </GlassPanel>

        {/* Action selector */}
        <GlassPanel strong className="flex-1">
          <div className="flex items-center gap-3 mb-6">
            <AvatarCard avatarId={myPlayer.avatarId} size={48} />
            <div>
              <p className="font-bold text-white">{myPlayer.name}</p>
              <p className="text-sm text-white/40">
                Score: <span className="text-white font-bold">{myPlayer.score}</span>
              </p>
            </div>
          </div>

          <ActionPanel
            key={`${round}-${phase}`}
            players={players}
            myId={playerId ?? ''}
            onSubmit={submitAction}
            disabled={myPlayer.hasSubmitted}
          />
        </GlassPanel>
      </main>
    );
  }

  // ── REVEAL PHASE ──────────────────────────────────────────
  if (phase === 'REVEAL' && lastRoundResult) {
    return (
      <main className="min-h-screen flex flex-col items-center p-4 gap-6 max-w-3xl mx-auto">
        <div className="text-center pt-8 animate-slide-up">
          <p className="text-white/40 uppercase tracking-widest text-sm mb-1">Round {round}</p>
          <h2 className="text-4xl font-black bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            REVEAL!
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full">
          {lastRoundResult.results.map((result, i) => {
            const player = players.find((p) => p.id === result.playerId);
            if (!player) return null;
            return (
              <RevealCard
                key={result.playerId}
                result={result}
                player={player}
                revealDelay={i * 200}
              />
            );
          })}
        </div>
      </main>
    );
  }

  // ── RESULTS PHASE ─────────────────────────────────────────
  if (phase === 'RESULTS') {
    return (
      <main className="min-h-screen flex flex-col items-center p-4 gap-6 max-w-2xl mx-auto">
        <div className="text-center pt-8 animate-slide-up">
          <p className="text-white/40 uppercase tracking-widest text-sm mb-1">Round {round} Results</p>
          <h2 className="text-3xl font-black text-white">Scoreboard</h2>
        </div>

        <GlassPanel className="w-full animate-slide-up">
          <Scoreboard
            players={players}
            pointTarget={pointTarget}
            highlightId={playerId ?? undefined}
          />
        </GlassPanel>

        {/* My result this round */}
        {lastRoundResult && playerId && (
          <GlassPanel className="w-full animate-slide-up">
            <p className="text-sm text-white/40 uppercase tracking-wider mb-2">Your Round</p>
            {(() => {
              const myResult = lastRoundResult.results.find((r) => r.playerId === playerId);
              if (!myResult) return null;
              return (
                <div className="flex items-center gap-3">
                  <span className="text-3xl">
                    {myResult.action === 'STRIKE' ? '⚔️' : myResult.action === 'SHIELD' ? '🛡️' : '👻'}
                  </span>
                  <div>
                    <p className="font-bold text-white">{myResult.resultLabel}</p>
                    {myResult.phantomReveal && (
                      <p className="text-xs text-indigo-300 mt-1">
                        👁 Intel: {players.find(p => p.id === myResult.phantomReveal!.revealedPlayerId)?.name} used{' '}
                        <strong>{myResult.phantomReveal.revealedAction}</strong>
                      </p>
                    )}
                  </div>
                </div>
              );
            })()}
          </GlassPanel>
        )}

        <p className="text-white/30 text-sm animate-pulse">Next round starting soon...</p>
      </main>
    );
  }

  // ── GAME OVER ─────────────────────────────────────────────
  if (phase === 'GAME_OVER') {
    const winner = gameState.winner;
    const winners = Array.isArray(winner) ? winner : winner ? [winner] : [];
    const isWinner = winners.some((w) => w.id === playerId);
    const isTie = winners.length > 1;

    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4 gap-6">
        <div className="text-center animate-slide-up">
          <div className="text-7xl mb-4 animate-float">
            {isWinner ? '🏆' : isTie ? '🤝' : '💀'}
          </div>
          <h1 className="text-5xl font-black mb-2">
            {isWinner && !isTie ? 'YOU WIN!' : isTie ? "IT'S A TIE!" : 'GAME OVER'}
          </h1>
          <p className="text-white/50 text-lg">
            {isTie
              ? `${winners.map((w) => w.name).join(' & ')} are co-winners!`
              : `${winners[0]?.name} wins with ${winners[0]?.score} points!`}
          </p>
        </div>

        {/* Winner avatars */}
        <div className="flex gap-6 justify-center flex-wrap animate-slide-up">
          {winners.map((w) => (
            <div key={w.id} className="text-center">
              <AvatarCard
                avatarId={w.avatarId}
                size={80}
                showName
                playerName={w.name}
              />
              <p className="mt-2 font-black text-xl text-yellow-400">{w.score} pts</p>
            </div>
          ))}
        </div>

        {/* Final scoreboard */}
        <GlassPanel className="w-full max-w-md animate-slide-up">
          <h3 className="font-bold text-white/60 text-sm uppercase tracking-wider mb-3">Final Scores</h3>
          <Scoreboard
            players={players}
            pointTarget={pointTarget}
            highlightId={winners[0]?.id}
          />
        </GlassPanel>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md animate-slide-up">
          {myPlayer.isHost && (
            <button className="btn-primary flex-1 py-4 text-lg" onClick={handlePlayAgain}>
              🔄 Play Again
            </button>
          )}
          <button className="btn-ghost flex-1 py-4" onClick={() => router.push('/')}>
            🏠 Home
          </button>
        </div>

        {!myPlayer.isHost && (
          <p className="text-white/30 text-sm">Waiting for host to start a new game...</p>
        )}
      </main>
    );
  }

  // ── WAITING / TRANSITION ──────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-white/40 animate-pulse text-lg">⏳ Preparing next round...</p>
    </div>
  );
}

