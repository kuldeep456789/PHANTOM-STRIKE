'use client';
// CountdownTimer — circular SVG ring that drains as time passes
import { useEffect, useState } from 'react';

interface CountdownTimerProps {
  totalSeconds: number;
  startedAt: number;   // Unix ms
  onExpire?: () => void;
}

const RADIUS = 45;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function CountdownTimer({ totalSeconds, startedAt, onExpire }: CountdownTimerProps) {
  const [remaining, setRemaining] = useState(totalSeconds);

  useEffect(() => {
    const tick = () => {
      const elapsed = (Date.now() - startedAt) / 1000;
      const left = Math.max(0, totalSeconds - elapsed);
      setRemaining(left);
      if (left <= 0) onExpire?.();
    };

    tick();
    const id = setInterval(tick, 100);
    return () => clearInterval(id);
  }, [totalSeconds, startedAt, onExpire]);

  const progress = remaining / totalSeconds;
  const dashOffset = CIRCUMFERENCE * (1 - progress);
  const isUrgent = remaining <= 5;

  return (
    <div className="relative flex items-center justify-center w-24 h-24">
      <svg className="-rotate-90 absolute inset-0 w-full h-full">
        {/* Track */}
        <circle
          cx="50%" cy="50%" r={RADIUS}
          fill="none" stroke="rgba(255,255,255,0.05)"
          strokeWidth="6"
        />
        {/* Progress ring */}
        <circle
          cx="50%" cy="50%" r={RADIUS}
          fill="none"
          stroke={isUrgent ? '#ef4444' : '#6366f1'}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={dashOffset}
          style={{ transition: 'stroke-dashoffset 0.1s linear, stroke 0.5s ease' }}
          className={isUrgent ? 'drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]' : ''}
        />
      </svg>
      <span
        className={`relative z-10 text-2xl font-black tabular-nums ${
          isUrgent ? 'text-red-400 animate-pulse' : 'text-white'
        }`}
      >
        {Math.ceil(remaining)}
      </span>
    </div>
  );
}

