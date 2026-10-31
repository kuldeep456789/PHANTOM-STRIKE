'use client';
// AvatarCard — renders a player avatar with glow ring
import Image from 'next/image';
import { AVATARS } from '@/lib/types';
import { cn } from '@/lib/utils';

interface AvatarCardProps {
  avatarId: number;
  size?: number;   // px
  className?: string;
  showName?: boolean;
  playerName?: string;
  isSubmitted?: boolean;
}

export default function AvatarCard({
  avatarId,
  size = 64,
  className,
  showName,
  playerName,
  isSubmitted,
}: AvatarCardProps) {
  const avatar = AVATARS[avatarId] ?? AVATARS[0];

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <div
        className="rounded-full p-[3px] transition-all duration-500"
        style={{
          background: isSubmitted
            ? `conic-gradient(from 0deg, ${avatar.accentHex}, transparent 60%, ${avatar.accentHex})`
            : `conic-gradient(from 0deg, ${avatar.accentHex}40, transparent)`,
          boxShadow: isSubmitted
            ? `0 0 24px ${avatar.accentHex}80`
            : `0 0 12px ${avatar.accentHex}40`,
          width: size + 6,
          height: size + 6,
        }}
      >
        <div className="rounded-full overflow-hidden bg-[#0a0a1a]" style={{ width: size, height: size }}>
          <Image
            src={`/avatars/avatar-${avatarId}.png`}
            alt={avatar.name}
            width={size}
            height={size}
            className="object-cover"
          />
        </div>
      </div>

      {showName && (
        <div className="text-center">
          <p className="text-sm font-bold text-white" style={{ color: avatar.accentHex }}>
            {avatar.name}
          </p>
          {playerName && (
            <p className="text-xs text-white/50 truncate max-w-[80px]">{playerName}</p>
          )}
        </div>
      )}

      {isSubmitted && (
        <div className="text-xs font-medium text-green-400 animate-pulse">✓ Locked</div>
      )}
    </div>
  );
}
