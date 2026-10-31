'use client';
// RevealCard — animates a player's action flip during reveal phase
import { useState, useEffect } from 'react';
import { PlayerResult, Player } from '@/lib/types';
import AvatarCard from '@/components/ui/AvatarCard';

const ACTION_EMOJI: Record<string, string> = {
  STRIKE: '⚔️',
  SHIELD: '🛡️',
  PHANTOM: '👻',
};

const ACTION_COLOR: Record<string, string> = {
  STRIKE: '#ef4444',
  SHIELD: '#3b82f6',
  PHANTOM: '#6366f1',
};

interface RevealCardProps {
  result: PlayerResult;
  player: Player;
  revealDelay?: number;   // ms before the flip animation starts
}

export default function RevealCard({ result, player, revealDelay = 0 }: RevealCardProps) {
  const [revealed, setRevealed] = useState(false);
  const isPositive = result.pointDelta > 0;
  const isNegative = result.pointDelta < 0;

  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), revealDelay);
    return () => clearTimeout(t);
  }, [revealDelay]);

  return (
    <div
      className="flex flex-col items-center gap-3 p-4 rounded-2xl border transition-all duration-500"
      style={{
        borderColor: revealed ? ACTION_COLOR[result.action] + '60' : 'rgba(255,255,255,0.05)',
        background: revealed ? ACTION_COLOR[result.action] + '10' : 'rgba(255,255,255,0.03)',
        boxShadow: revealed ? `0 0 20px ${ACTION_COLOR[result.action]}30` : 'none',
      }}
    >
      <AvatarCard avatarId={player.avatarId} size={56} />

      <p className="font-bold text-white text-sm truncate max-w-full">{player.name}</p>

      {/* Action reveal */}
      <div
        className="text-4xl transition-all duration-500"
        style={{
          opacity: revealed ? 1 : 0,
          transform: revealed ? 'scale(1)' : 'scale(0.5) rotateY(90deg)',
        }}
      >
        {ACTION_EMOJI[result.action]}
      </div>

      <p className="text-xs font-bold tracking-wider uppercase" style={{ color: ACTION_COLOR[result.action] }}>
        {revealed ? result.action : '???'}
      </p>

      {/* Point delta */}
      {revealed && (
        <div
          className={`text-lg font-black animate-score-pop ${
            isPositive ? 'text-green-400' : isNegative ? 'text-red-400' : 'text-white/40'
          }`}
        >
          {result.pointDelta > 0 ? '+' : ''}{result.pointDelta} pts
        </div>
      )}

      {/* Result label */}
      {revealed && (
        <p className="text-xs text-white/50 text-center leading-relaxed px-1">
          {result.resultLabel}
        </p>
      )}
    </div>
  );
}
