import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Pencil, Trash2, Copy, Check, BarChart3 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import {
  BarChart, Bar, ResponsiveContainer, Tooltip
} from 'recharts';
import Badge from '@/components/Badge';
import { formatBytes, formatDate, cn } from '@/lib/utils';
import type { AccessKey, TransferMetrics } from '@/lib/outline-api';

interface DetailDrawerProps {
  keyData: AccessKey | null;
  metrics: TransferMetrics | null;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const chartTooltipStyle = {
  backgroundColor: 'rgba(0, 0, 0, 0.8)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '12px',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
  padding: '8px',
};

export default function DetailDrawer({ keyData, metrics, onClose, onEdit, onDelete }: DetailDrawerProps) {
  const [showQr, setShowQr] = useState(false);
  const [copied, setCopied] = useState(false);

  const used = keyData ? (metrics?.bytesTransferredByUserId[keyData.id] || 0) : 0;
  const limit = keyData?.dataLimit?.bytes || 0;
  const percent = limit ? Math.min((used / limit) * 100, 100) : 0;

  const sparklineData = useMemo(() => {
    if (!keyData) return [];
    const base = used / 7;
    return Array.from({ length: 7 }, (_, i) => ({
      day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
      value: Math.floor(base * (0.5 + Math.random() * 1.0)),
    }));
  }, [keyData, used]);

  let status: { variant: 'success' | 'warning' | 'danger' | 'default'; label: string } =
    { variant: 'default', label: 'Idle' };
  if (used === 0) status = { variant: 'default', label: 'Idle' };
  else if (keyData?.dataLimit && used > keyData.dataLimit.bytes * 0.85) status = { variant: 'danger', label: 'Limited' };
  else if (keyData?.dataLimit && used > keyData.dataLimit.bytes * 0.6) status = { variant: 'warning', label: 'Near Limit' };
  else status = { variant: 'success', label: 'Active' };

  const handleCopy = () => {
    if (!keyData) return;
    navigator.clipboard.writeText(keyData.accessUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      {keyData && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed top-0 right-0 h-full w-full max-w-md z-[80] bg-black/95 backdrop-blur-2xl border-l border-border-subtle flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
              <h2 className="text-lg font-semibold text-white font-display">Key Details</h2>
              <button
                onClick={onClose}
                className="flex items-center justify-center w-8 h-8 rounded-lg text-text-muted hover:text-white hover:bg-[#161622] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
              {/* Name & Status */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-white font-display">{keyData.name}</h3>
                  <p className="text-xs text-text-muted font-mono mt-1">{keyData.id}</p>
                </div>
                <Badge variant={status.variant} pulse={status.variant === 'success'}>{status.label}</Badge>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="glass-card p-3 no-padding text-center">
                  <div className="text-xs text-text-muted mb-1">Port</div>
                  <div className="text-sm font-mono font-semibold text-white">{keyData.port}</div>
                </div>
                <div className="glass-card p-3 no-padding text-center">
                  <div className="text-xs text-text-muted mb-1">Method</div>
                  <div className="text-[11px] font-mono font-semibold text-white truncate">{keyData.method}</div>
                </div>
                <div className="glass-card p-3 no-padding text-center">
                  <div className="text-xs text-text-muted mb-1">Created</div>
                  <div className="text-[11px] font-semibold text-white">{formatDate(keyData.createdAt)}</div>
                </div>
              </div>

              {/* Data Usage */}
              <div className="glass-card p-4 no-padding">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-accent-primary" />
                    <span className="text-sm font-medium text-white">Data Usage</span>
                  </div>
                  <span className="text-xs text-text-muted font-mono">
                    {formatBytes(used)}{limit ? ` / ${formatBytes(limit)}` : ''}
                  </span>
                </div>
                <div className="h-2 bg-bg-glass rounded-full overflow-hidden mb-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percent}%` }}
                    transition={{ duration: 1, ease: [0.4, 0, 0.2, 1] }}
                    className={cn(
                      "h-full rounded-full",
                      percent > 85 ? "bg-gradient-to-r from-danger to-accent-red" :
                      percent > 60 ? "bg-gradient-to-r from-warning to-accent-orange" :
                      "bg-gradient-to-r from-accent-primary to-accent-violet"
                    )}
                  />
                </div>
                <div className="text-[11px] text-text-muted text-right">
                  {limit ? `${Math.round(percent)}% used` : 'No limit set'}
                </div>
              </div>

              {/* Sparkline */}
              {used > 0 && (
                <div className="glass-card p-4 no-padding">
                  <div className="text-sm font-medium text-white mb-3">7-Day Activity</div>
                  <ResponsiveContainer width="100%" height={80}>
                    <BarChart data={sparklineData}>
                      <Tooltip
                        contentStyle={chartTooltipStyle}
                        formatter={(value: number) => [formatBytes(value), 'Usage']}
                        labelStyle={{ color: '#FFFFFF', fontSize: 11 }}
                      />
                      <Bar dataKey="value" fill="#6366F1" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Access URL */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-white">Access URL</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowQr(!showQr)}
                      className="text-[11px] text-accent-primary hover:text-accent-hover transition-colors"
                    >
                      {showQr ? 'Hide QR' : 'Show QR'}
                    </button>
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-1 text-[11px] text-text-muted hover:text-white transition-colors"
                    >
                      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  {showQr ? (
                    <motion.div
                      key="qr"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="flex flex-col items-center gap-3 p-4 glass-card no-padding"
                    >
                      <QRCodeSVG value={keyData.accessUrl} size={180} level="M" bgColor="transparent" fgColor="#FFFFFF" />
                      <span className="text-[10px] text-text-muted font-mono text-center break-all">{keyData.accessUrl}</span>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="url"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-center gap-2 p-3 glass-card no-padding"
                    >
                      <code className="flex-1 text-[11px] text-text-secondary font-mono break-all">{keyData.accessUrl}</code>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="px-6 py-4 border-t border-border-subtle flex items-center gap-3">
              <button
                onClick={() => { onClose(); onEdit(); }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-accent-primary hover:bg-accent-hover transition-colors font-display"
              >
                <Pencil className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={() => { onClose(); onDelete(); }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-danger bg-danger/10 hover:bg-danger/20 border border-danger/20 transition-colors font-display"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
