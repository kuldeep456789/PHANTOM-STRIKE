'use client';
// ActionPanel — where player picks STRIKE / SHIELD / PHANTOM
import { useState } from 'react';
import { ActionType, Player } from '@/lib/types';
import AvatarCard from '@/components/ui/AvatarCard';
import { cn } from '@/lib/utils';

interface ActionPanelProps {
  players: Player[];       // all players except self
  myId: string;
  onSubmit: (action: ActionType, targetId?: string) => void;
  disabled?: boolean;
}

const ACTIONS: Array<{
  type: ActionType;
  emoji: string;
  label: string;
  desc: string;
  color: string;
  needsTarget: boolean;
}> = [
  {
    type: 'STRIKE',
    emoji: '⚔️',
    label: 'STRIKE',
    desc: 'Attack a target. Hit = +2 / −2. Blocked = −1.',
    color: 'rgba(239,68,68,0.3)',
    needsTarget: true,
  },
  {
    type: 'SHIELD',
    emoji: '🛡️',
    label: 'SHIELD',
    desc: 'Protect yourself. Idle = +1. Block = +1 (attacker −1).',
    color: 'rgba(59,130,246,0.3)',
    needsTarget: false,
  },
  {
    type: 'PHANTOM',
    emoji: '👻',
    label: 'PHANTOM',
    desc: 'Vanish — untouchable. +1 pt. Reveals a secret.',
    color: 'rgba(99,102,241,0.3)',
    needsTarget: false,
  },
];

export default function ActionPanel({ players, myId, onSubmit, disabled }: ActionPanelProps) {
  const [selected, setSelected]     = useState<ActionType | null>(null);
  const [targetId, setTargetId]     = useState<string | null>(null);
  const [submitted, setSubmitted]   = useState(false);

  const opponents = players.filter((p) => p.id !== myId && p.isConnected);
  const needsTarget = selected === 'STRIKE';
  const canSubmit = selected && (!needsTarget || targetId) && !submitted;

  function handleSubmit() {
    if (!canSubmit || !selected) return;
    setSubmitted(true);
    onSubmit(selected, targetId ?? undefined);
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-4 py-12 animate-fade-in">
        <div className="text-6xl animate-float">🔒</div>
        <h3 className="text-2xl font-bold text-white">Action Locked</h3>
        <p className="text-white/50">Waiting for other operatives...</p>
        <div className="flex gap-1 mt-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Action selection */}
      <div>
        <p className="text-sm font-medium text-white/50 mb-3 uppercase tracking-wider">
          Choose your action
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {ACTIONS.map((action) => (
            <button
              key={action.type}
              onClick={() => {
                setSelected(action.type);
                if (!action.needsTarget) setTargetId(null);
              }}
              disabled={disabled}
              className={cn(
                'action-card text-left',
                selected === action.type && 'selected'
              )}
              style={{
                background: selected === action.type ? action.color : undefined,
              }}
            >
              <span className="text-4xl">{action.emoji}</span>
              <span className="text-lg font-black tracking-wider">{action.label}</span>
              <span className="text-xs text-white/50 text-center leading-relaxed">{action.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Target selection (only for STRIKE) */}
      {needsTarget && (
        <div className="animate-slide-up">
          <p className="text-sm font-medium text-white/50 mb-3 uppercase tracking-wider">
            Choose your target
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {opponents.map((p) => (
              <button
                key={p.id}
                onClick={() => setTargetId(p.id)}
                className={cn(
                  'flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200',
                  targetId === p.id
                    ? 'border-red-500 bg-red-500/20 shadow-[0_0_16px_rgba(239,68,68,0.4)]'
                    : 'border-white/10 hover:border-white/25 bg-white/5'
                )}
              >
                <AvatarCard avatarId={p.avatarId} size={48} />
                <span className="text-xs font-semibold text-white/80 truncate max-w-full px-1">
                  {p.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Submit button */}
      <button
        onClick={handleSubmit}
        disabled={!canSubmit || !!disabled}
        className="btn-primary w-full text-lg py-4 mt-2"
      >
        {canSubmit ? `🔒 Lock In ${selected}${needsTarget && targetId ? ` → Target` : ''}` : 'Select an action...'}
      </button>
    </div>
  );
}
