'use client';
// ============================================================
// Landing Page — Create or Join a room
// ============================================================
import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useSocket } from '@/hooks/useSocket';
import { useGameState } from '@/hooks/useGameState';
import AvatarPicker from '@/components/lobby/AvatarPicker';
import GlassPanel from '@/components/layout/GlassPanel';
import ErrorToast from '@/components/ui/ErrorToast';

export default function LandingPage() {
  const router = useRouter();
  const { emit } = useSocket();
  const { gameState, roomCode: currentRoomCode, error, clearError } = useGameState();

  const [name, setName]           = useState('');
  const [roomCode, setRoomCode]   = useState('');
  const [avatarId, setAvatarId]   = useState(0);
  const [mode, setMode]           = useState<'home' | 'create' | 'join'>('home');
  const [loading, setLoading]     = useState(false);

  // Navigate to lobby once room is successfully created or joined
  useEffect(() => {
    if (currentRoomCode && gameState?.phase === 'LOBBY') {
      router.push(`/lobby/${currentRoomCode}`);
    }
  }, [currentRoomCode, gameState?.phase, router]);

  const isLoading = loading && !error;

  function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    emit('create_room', { playerName: name.trim(), avatarId });
  }

  function handleJoin(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || !roomCode.trim()) return;
    setLoading(true);
    emit('join_room', {
      roomCode: roomCode.trim().toUpperCase(),
      playerName: name.trim(),
      avatarId,
    });
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 relative">
      {/* Background particles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full opacity-10 animate-float"
            style={{
              width: `${80 + i * 40}px`,
              height: `${80 + i * 40}px`,
              background: `radial-gradient(circle, ${['#6366f1','#22d3ee','#ef4444','#22c55e','#eab308','#ec4899'][i]}, transparent)`,
              left: `${10 + i * 15}%`,
              top: `${10 + (i % 3) * 30}%`,
              animationDelay: `${i * 0.5}s`,
            }}
          />
        ))}
      </div>

      {/* Logo */}
      <div className="text-center mb-12 animate-slide-up">
        <div className="flex items-center justify-center gap-3 mb-3">
          <span className="text-5xl">🔮</span>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
            PHANTOM
          </h1>
        </div>
        <h2 className="text-4xl md:text-6xl font-black tracking-widest text-white/90">
          STRIKE
        </h2>
        <p className="mt-4 text-white/50 text-lg font-medium">
          Secret actions. Simultaneous reveals. No mercy.
        </p>
      </div>

      {/* Error toast */}
      {error && <ErrorToast message={error} onClose={clearError} />}

      {/* Home — CTA buttons */}
      {mode === 'home' && (
        <div className="flex flex-col sm:flex-row gap-4 animate-slide-up">
          <button className="btn-primary text-lg px-10 py-4" onClick={() => setMode('create')}>
            ⚔️ Create Room
          </button>
          <button className="btn-ghost text-lg px-10 py-4" onClick={() => setMode('join')}>
            🔑 Join Room
          </button>
        </div>
      )}

      {/* Create / Join form */}
      {(mode === 'create' || mode === 'join') && (
        <GlassPanel className="w-full max-w-md animate-slide-up">
          <h2 className="text-2xl font-bold mb-6 text-center">
            {mode === 'create' ? '⚔️ Create a Room' : '🔑 Join a Room'}
          </h2>

          <form onSubmit={mode === 'create' ? handleCreate : handleJoin} className="space-y-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Your Name</label>
              <input
                className="input-dark"
                placeholder="Enter your operative name..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={16}
                autoFocus
              />
            </div>

            {/* Room code (join only) */}
            {mode === 'join' && (
              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">Room Code</label>
                <input
                  className="input-dark text-center text-2xl font-mono font-bold tracking-widest uppercase"
                  placeholder="XXXX"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase().slice(0, 4))}
                  maxLength={4}
                />
              </div>
            )}

            {/* Avatar picker */}
            <div>
              <label className="block text-sm font-medium text-white/60 mb-3">Choose Your Operative</label>
              <AvatarPicker selected={avatarId} onSelect={setAvatarId} takenIds={[]} />
            </div>

            {/* Submit */}
            <button type="submit" className="btn-primary w-full text-lg py-4" disabled={isLoading || !name.trim()}>
              {isLoading ? '⏳ Connecting...' : mode === 'create' ? '⚔️ Create Room' : '🔑 Enter Room'}
            </button>
          </form>

          <button onClick={() => setMode('home')} className="btn-ghost w-full mt-3 text-sm">
            ← Back
          </button>
        </GlassPanel>
      )}

      {/* Footer */}
      <p className="mt-12 text-white/20 text-sm">
        2–8 players · No login required · Join by room code
      </p>
    </main>
  );
}
