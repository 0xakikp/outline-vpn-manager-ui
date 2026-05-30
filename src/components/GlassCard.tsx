import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  glow?: 'violet' | 'blue' | 'green' | 'orange' | 'pink' | 'cyan' | 'red' | 'none';
  className?: string;
  shimmer?: boolean;
  float?: boolean;
  delay?: number;
  noPadding?: boolean;
}

const glowClassMap = {
  violet: 'glow-violet',
  blue: 'glow-blue',
  green: 'glow-green',
  orange: 'glow-orange',
  pink: 'glow-pink',
  cyan: 'glow-cyan',
  red: 'glow-red',
  none: '',
};

export default function GlassCard({
  children,
  glow = 'none',
  className,
  shimmer = false,
  float = false,
  delay = 0,
  noPadding = false,
}: GlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: delay / 1000,
        ease: [0.4, 0, 0.2, 1] as [number, number, number, number],
      }}
      className={cn(
        'glass-card',
        glow !== 'none' && glowClassMap[glow],
        shimmer && 'shimmer',
        float && 'float-anim',
        !noPadding && 'p-5',
        className
      )}
    >
      {children}
    </motion.div>
  );
}
