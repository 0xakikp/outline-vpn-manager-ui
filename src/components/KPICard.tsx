import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import AnimatedCounter from './AnimatedCounter';

interface KPICardProps {
  icon: ReactNode;
  iconBg: string;
  iconColor?: string;
  value: string | number;
  label: string;
  trend?: string;
  trendUp?: boolean;
  delay?: number;
  className?: string;
  glow?: 'violet' | 'blue' | 'green' | 'orange' | 'pink' | 'cyan' | 'red' | 'none';
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

export default function KPICard({
  icon,
  iconBg,
  iconColor = '#FFFFFF',
  value,
  label,
  trend,
  trendUp,
  delay = 0,
  className,
  glow = 'none',
}: KPICardProps) {
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;
  const isNumeric = !isNaN(numericValue) && String(value) === String(numericValue);

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
        'glass-card shimmer p-5 group',
        glow !== 'none' && glowClassMap[glow],
        className
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <div
          className="flex items-center justify-center w-10 h-10 rounded-xl transition-transform duration-300 group-hover:scale-110"
          style={{
            backgroundColor: iconBg,
            boxShadow: `0 0 20px ${iconBg}`,
          }}
        >
          <div style={{ color: iconColor }}>{icon}</div>
        </div>
        {trend && (
          <span
            className={cn(
              'text-xs font-semibold px-2 py-0.5 rounded-full font-display',
              trendUp === undefined && 'text-text-muted bg-bg-glass',
              trendUp === true && 'text-success bg-success/10',
              trendUp === false && 'text-danger bg-danger/10'
            )}
          >
            {trend}
          </span>
        )}
      </div>
      <div className="text-[28px] font-bold text-text-primary leading-tight tracking-tight mb-0.5 font-display">
        {isNumeric ? (
          <AnimatedCounter
            value={numericValue}
            delay={delay}
            format={numericValue >= 1000 ? formatNumber : undefined}
          />
        ) : (
          value
        )}
      </div>
      <div className="text-[11px] font-semibold text-text-muted uppercase tracking-[0.06em]">
        {label}
      </div>
    </motion.div>
  );
}

function formatNumber(n: number): string {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + 'B';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return String(n);
}
