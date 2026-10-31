'use client';
// GlassPanel — reusable glass morphism container
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface GlassPanelProps {
  children: ReactNode;
  className?: string;
  strong?: boolean;
}

export default function GlassPanel({ children, className, strong }: GlassPanelProps) {
  return (
    <div className={cn(strong ? 'glass-strong' : 'glass', 'rounded-2xl p-6', className)}>
      {children}
    </div>
  );
}

