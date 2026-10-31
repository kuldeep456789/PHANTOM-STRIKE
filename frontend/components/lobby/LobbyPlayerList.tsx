'use client';
// LobbyPlayerList — shows all connected players with their avatars
import { Player } from '@/lib/types';
import { AVATARS } from '@/lib/types';
import AvatarCard from '@/components/ui/AvatarCard';
import { cn } from '@/lib/utils';

interface LobbyPlayerListProps {
  players: Player[];
  myId: string;
  isHost: boolean;
  onKick?: (playerId: string) => void;
}

export default function LobbyPlayerList({ players, myId, isHost, onKick }: LobbyPlayerListProps) {
  return (
    <div className="space-y-2">
      {players.map((p, i) => {
        const avatar = AVATARS[p.avatarId] ?? AVATARS[0];
        const isMe = p.id === myId;

        return (
          <div
            key={p.id}
            className={cn(
              'flex items-center gap-3 p-3 rounded-xl border transition-all duration-300 animate-slide-up',
              isMe ? 'border-indigo-500/40 bg-indigo-500/10' : 'border-white/5 bg-white/3'
            )}
            style={{ animationDelay: `${i * 0.05}s` }}
          >
            <AvatarCard avatarId={p.avatarId} size={44} />

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white truncate">{p.name}</span>
                {isMe && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-300 font-medium">
                    You
                  </span>
                )}
                {p.isHost && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300 font-medium">
                    👑 Host
                  </span>
                )}
              </div>
              <p className="text-xs" style={{ color: avatar.accentHex }}>
                {avatar.name} · {avatar.title}
              </p>
            </div>

            {/* Kick button — host only, not for self */}
            {isHost && !isMe && onKick && (
              <button
                onClick={() => onKick(p.id)}
                className="text-xs text-red-400/60 hover:text-red-400 transition-colors px-2 py-1 rounded"
              >
                ✕
              </button>
            )}

            {!p.isConnected && (
              <span className="text-xs text-red-400/60">Disconnected</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
