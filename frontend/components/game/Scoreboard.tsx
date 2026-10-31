'use client';
// Scoreboard — live score table shown on results screen
import { Player } from '@/lib/types';
import { AVATARS } from '@/lib/types';
import AvatarCard from '@/components/ui/AvatarCard';

interface ScoreboardProps {
  players: Player[];
  pointTarget: number;
  highlightId?: string;
}

export default function Scoreboard({ players, pointTarget, highlightId }: ScoreboardProps) {
  const sorted = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="space-y-2">
      {sorted.map((p, rank) => {
        const avatar = AVATARS[p.avatarId] ?? AVATARS[0];
        const pct = Math.min(100, (p.score / pointTarget) * 100);
        const isHighlighted = p.id === highlightId;

        return (
          <div
            key={p.id}
            className="flex items-center gap-3 p-3 rounded-xl border transition-all duration-500"
            style={{
              borderColor: isHighlighted ? avatar.accentHex + '60' : 'rgba(255,255,255,0.06)',
              background: isHighlighted ? avatar.accentHex + '12' : 'rgba(255,255,255,0.03)',
            }}
          >
            {/* Rank */}
            <span className="text-xl font-black w-8 text-center text-white/40">
              {rank === 0 ? '🥇' : rank === 1 ? '🥈' : rank === 2 ? '🥉' : `#${rank + 1}`}
            </span>

            <AvatarCard avatarId={p.avatarId} size={40} />

            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center mb-1">
                <span className="font-semibold text-white text-sm truncate">{p.name}</span>
                <span className="font-black text-white ml-2">{p.score}</span>
              </div>
              {/* Progress bar */}
              <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${pct}%`,
                    background: avatar.accentHex,
                    boxShadow: `0 0 8px ${avatar.accentHex}80`,
                  }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
