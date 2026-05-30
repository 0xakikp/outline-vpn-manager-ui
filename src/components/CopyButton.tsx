import { useState, useCallback } from 'react';
import { Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CopyButtonProps {
  text: string;
  className?: string;
  onCopy?: () => void;
}

export default function CopyButton({ text, className, onCopy }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      onCopy?.();
      setTimeout(() => setCopied(false), 1500);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      onCopy?.();
      setTimeout(() => setCopied(false), 1500);
    }
  }, [text, onCopy]);

  return (
    <button
      onClick={handleCopy}
      className={cn(
        'inline-flex items-center justify-center w-7 h-7 rounded-md text-text-muted hover:text-white hover:bg-bg-tertiary transition-all duration-200',
        copied && 'text-success bg-success/10',
        className
      )}
      title="Copy to clipboard"
    >
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}
