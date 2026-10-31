'use client';
// AvatarPicker — grid of 8 avatars for lobby selection
import { AVATARS } from '@/lib/types';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface AvatarPickerProps {
  selected: number;
  onSelect: (id: number) => void;
  takenIds: number[];   // avatarIds already claimed by other players
}

export default function AvatarPicker({ selected, onSelect, takenIds }: AvatarPickerProps) {
  return (
    <div className="grid grid-cols-4 gap-3">
      {AVATARS.map((avatar) => {
        const isTaken = takenIds.includes(avatar.id);
        const isSelected = selected === avatar.id;

        return (
          <button
            key={avatar.id}
            type="button"
            onClick={() => !isTaken && onSelect(avatar.id)}
            disabled={isTaken}
            className={cn(
              'relative flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all duration-200',
              isSelected
                ? 'border-opacity-100 scale-105'
                : 'border-white/10 hover:border-white/30',
              isTaken && 'opacity-30 cursor-not-allowed grayscale'
            )}
            style={{
              borderColor: isSelected ? avatar.accentHex : undefined,
              boxShadow: isSelected ? `0 0 16px ${avatar.accentHex}60` : undefined,
            }}
          >
            <div className="rounded-full overflow-hidden w-12 h-12">
              <Image
                src={`/avatars/avatar-${avatar.id}.png`}
                alt={avatar.name}
                width={48}
                height={48}
                className="object-cover"
              />
            </div>
            <span className="text-[10px] font-bold text-white/70 truncate w-full text-center">
              {avatar.name}
            </span>
            {isTaken && (
              <span className="absolute top-1 right-1 text-[9px] bg-red-500/80 text-white rounded px-1">
                TAKEN
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
