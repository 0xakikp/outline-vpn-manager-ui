import { useRef, type MouseEvent, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SpotlightCardProps {
  children: ReactNode;
  className?: string;
  glowColor?: string;
  delay?: number;
}

export default function SpotlightCard({
  children,
  className,
  glowColor = 'rgba(255,255,255,0.04)',
  delay = 0,
}: SpotlightCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    card.style.setProperty('--mouse-x', `${x}px`);
    card.style.setProperty('--mouse-y', `${y}px`);
  };

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: delay / 1000,
        ease: [0.4, 0, 0.2, 1] as [number, number, number, number],
      }}
      onMouseMove={handleMouseMove}
      className={cn(
        'glass-card spotlight-card relative overflow-hidden',
        className
      )}
      style={{ '--spotlight-color': glowColor } as React.CSSProperties}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: 'radial-gradient(600px circle at var(--mouse-x) var(--mouse-y), var(--spotlight-color, rgba(255,255,255,0.04)), transparent 40%)',
        }}
      />
      {children}
    </motion.div>
  );
}
