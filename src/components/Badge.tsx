import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'default';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
  pulse?: boolean;
}

const variantStyles: Record<BadgeVariant, string> = {
  success: 'bg-success/10 text-success border border-success/20',
  warning: 'bg-warning/10 text-warning border border-warning/20',
  danger: 'bg-danger/10 text-danger border border-danger/20',
  info: 'bg-info/10 text-info border border-info/20',
  default: 'bg-bg-glass text-text-secondary border border-border-subtle',
};

const dotColors: Record<BadgeVariant, string> = {
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  info: 'bg-info',
  default: 'bg-text-muted',
};

export default function Badge({ children, variant = 'default', className, pulse = false }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold',
        variantStyles[variant],
        className
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full relative', dotColors[variant])}>
        {pulse && (
          <span
            className={cn('absolute inset-0 rounded-full animate-ping opacity-60', dotColors[variant])}
          />
        )}
      </span>
      {children}
    </span>
  );
}
