import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Server, Globe, Link2, AlertTriangle, Check, Loader2,
  Fingerprint, Clock, Hash
} from 'lucide-react';
import GlassCard from '@/components/GlassCard';
import CopyButton from '@/components/CopyButton';
import { formatDate, cn } from '@/lib/utils';
import type { ServerInfo, AccessKey } from '@/lib/outline-api';

interface SettingsTabProps {
  serverInfo: ServerInfo | null;
  accessKeys: AccessKey[];
  loading: boolean;
  onUpdateServerName: (name: string) => Promise<void>;
  onUpdateHostname: (hostname: string) => Promise<void>;
  onUpdatePort: (port: number) => Promise<void>;
  onDeleteDataLimit: (id: string) => Promise<void>;
  onDisconnect: () => void;
}

function AutoSaveInput({
  label,
  value,
  onSave,
  type = 'text',
  placeholder,
  helper,
  icon: Icon,
}: {
  label: string;
  value: string;
  onSave: (v: string) => Promise<void>;
  type?: string;
  placeholder?: string;
  helper?: string;
  icon?: React.ElementType;
}) {
  const [localValue, setLocalValue] = useState(value);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleBlur = async () => {
    if (localValue !== value && localValue.trim()) {
      setSaving(true);
      try {
        await onSave(localValue);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } finally {
        setSaving(false);
      }
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-text-secondary mb-2">{label}</label>
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        )}
        <input
          type={type}
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={cn(
            "w-full glass-input",
            Icon && "pl-10"
          )}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {saving && <Loader2 className="w-4 h-4 text-accent-primary animate-spin" />}
          {!saving && saved && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 15 }}
            >
              <Check className="w-4 h-4 text-success" />
            </motion.div>
          )}
        </div>
      </div>
      {helper && <p className="text-[11px] text-text-muted mt-1.5">{helper}</p>}
    </div>
  );
}

export default function SettingsTab({
  serverInfo,
  accessKeys,
  loading,
  onUpdateServerName,
  onUpdateHostname,
  onUpdatePort,
  onDeleteDataLimit,
  onDisconnect,
}: SettingsTabProps) {
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [disconnectConfirmOpen, setDisconnectConfirmOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  const handleResetAllLimits = useCallback(async () => {
    setResetting(true);
    try {
      for (const key of accessKeys) {
        if (key.dataLimit) {
          await onDeleteDataLimit(key.id);
        }
      }
    } finally {
      setResetting(false);
      setResetConfirmOpen(false);
    }
  }, [accessKeys, onDeleteDataLimit]);

  const handleDisconnect = useCallback(() => {
    setDisconnectConfirmOpen(false);
    onDisconnect();
  }, [onDisconnect]);

  if (loading) {
    return (
      <div className="space-y-4 max-w-3xl mx-auto">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="glass-card p-5 animate-skeleton-pulse">
            <div className="w-8 h-8 bg-bg-glass rounded-lg mb-3" />
            <div className="h-4 w-32 bg-bg-glass rounded mb-2" />
            <div className="h-10 bg-bg-glass rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-3xl font-bold font-display tracking-tight text-white mb-2">Settings</h1>
        <div className="w-24 h-0.5 bg-gradient-to-r from-accent-orange to-accent-red rounded-full" />
        <p className="font-accent italic text-text-secondary mt-2">Configure your server preferences</p>
      </motion.div>

      {/* Server Identity */}
      <GlassCard glow="violet" delay={0}>
        <div className="flex items-center gap-2.5 mb-4">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: 'rgba(139, 92, 246, 0.15)', boxShadow: '0 0 20px rgba(139, 92, 246, 0.15)' }}
          >
            <Server className="w-4.5 h-4.5 text-accent-violet" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white font-display">Server Identity</h2>
            <p className="text-xs text-text-muted">Basic server configuration</p>
          </div>
        </div>
        <div className="space-y-4">
          <AutoSaveInput
            label="Server Name"
            value={serverInfo?.name || ''}
            onSave={onUpdateServerName}
            placeholder="My Outline Server"
            helper="This name is displayed in the dashboard header"
            icon={Server}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Server ID</label>
              <div className="flex items-center gap-2 px-3 py-2.5 glass-card no-padding">
                <Hash className="w-4 h-4 text-text-muted flex-shrink-0" />
                <span className="text-xs text-text-secondary font-mono truncate">{serverInfo?.serverId}</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Created</label>
              <div className="flex items-center gap-2 px-3 py-2.5 glass-card no-padding">
                <Clock className="w-4 h-4 text-text-muted flex-shrink-0" />
                <span className="text-xs text-text-secondary">{formatDate(serverInfo?.createdTimestampMs || 0)}</span>
              </div>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Network Configuration */}
      <GlassCard glow="blue" delay={100}>
        <div className="flex items-center gap-2.5 mb-4">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)', boxShadow: '0 0 20px rgba(59, 130, 246, 0.15)' }}
          >
            <Globe className="w-4.5 h-4.5 text-accent-blue" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white font-display">Network Configuration</h2>
            <p className="text-xs text-text-muted">Hostname and port settings</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AutoSaveInput
            label="Hostname"
            value={serverInfo?.hostnameForAccessKeys || ''}
            onSave={onUpdateHostname}
            placeholder="vpn.example.com"
            helper="Domain or IP for access key URLs"
            icon={Globe}
          />
          <AutoSaveInput
            label="Port for New Keys"
            value={String(serverInfo?.portForNewAccessKeys || '')}
            onSave={(v) => onUpdatePort(parseInt(v) || 0)}
            type="number"
            placeholder="65258"
            helper="Default port for new access keys"
            icon={Link2}
          />
        </div>
      </GlassCard>

      {/* Connection Info */}
      <GlassCard glow="green" delay={200}>
        <div className="flex items-center gap-2.5 mb-4">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: 'rgba(34, 197, 94, 0.15)', boxShadow: '0 0 20px rgba(34, 197, 94, 0.15)' }}
          >
            <Link2 className="w-4.5 h-4.5 text-accent-green" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white font-display">Connection Info</h2>
            <p className="text-xs text-text-muted">API endpoint details</p>
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">API URL</label>
            <div className="flex items-center gap-2 px-3 py-2.5 glass-card no-padding">
              <code className="flex-1 text-xs text-text-secondary font-mono break-all">
                https://{serverInfo?.hostnameForAccessKeys || 'localhost'}:{serverInfo?.portForNewAccessKeys || 65258}/api
              </code>
              <CopyButton text={`https://${serverInfo?.hostnameForAccessKeys || 'localhost'}:${serverInfo?.portForNewAccessKeys || 65258}/api`} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Certificate Fingerprint</label>
            <div className="flex items-center gap-2 px-3 py-2.5 glass-card no-padding">
              <Fingerprint className="w-4 h-4 text-text-muted flex-shrink-0" />
              <code className="flex-1 text-xs text-text-muted font-mono truncate">
                SHA256:a1b2c3d4e5f6789... (mock)
              </code>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Danger Zone */}
      <GlassCard glow="red" delay={300}>
        <div className="flex items-center gap-2.5 mb-4">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', boxShadow: '0 0 20px rgba(239, 68, 68, 0.15)' }}
          >
            <AlertTriangle className="w-4.5 h-4.5 text-danger" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white font-display">Danger Zone</h2>
            <p className="text-xs text-text-muted">Irreversible actions</p>
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 glass-card no-padding">
            <div>
              <div className="text-sm font-medium text-white font-display">Reset All Data Limits</div>
              <div className="text-[11px] text-text-muted">Remove data limits from all {accessKeys.length} keys</div>
            </div>
            <button
              onClick={() => setResetConfirmOpen(true)}
              className="px-3 py-1.5 text-xs font-medium text-danger border border-danger/30 hover:bg-danger/10 rounded-lg transition-colors font-display"
            >
              Reset
            </button>
          </div>
          <div className="flex items-center justify-between p-3 glass-card no-padding">
            <div>
              <div className="text-sm font-medium text-white font-display">Disconnect</div>
              <div className="text-[11px] text-text-muted">Remove this server from the manager</div>
            </div>
            <button
              onClick={() => setDisconnectConfirmOpen(true)}
              className="px-3 py-1.5 text-xs font-medium text-danger border border-danger/30 hover:bg-danger/10 rounded-lg transition-colors font-display"
            >
              Disconnect
            </button>
          </div>
        </div>
      </GlassCard>

      {/* Reset Confirm Modal */}
      {resetConfirmOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-xl" onClick={() => !resetting && setResetConfirmOpen(false)} />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="relative w-full max-w-md mx-4 glass-card glow-red gradient-border"
          >
            <div className="flex items-start gap-3 mb-4 p-6 pb-0">
              <div className="w-10 h-10 rounded-xl bg-danger/10 flex items-center justify-center flex-shrink-0 border border-danger/20">
                <AlertTriangle className="w-5 h-5 text-danger" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white font-display">Reset All Limits?</h3>
                <p className="text-sm text-text-secondary mt-1">
                  This will remove data limits from all {accessKeys.filter(k => k.dataLimit).length} access keys. This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 pt-2">
              <button
                onClick={() => setResetConfirmOpen(false)}
                disabled={resetting}
                className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-white transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleResetAllLimits}
                disabled={resetting}
                className="px-4 py-2 text-sm font-medium bg-danger hover:bg-accent-red text-white rounded-lg transition-colors disabled:opacity-50 font-display flex items-center gap-2"
              >
                {resetting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {resetting ? 'Resetting...' : 'Reset All'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Disconnect Confirm Modal */}
      {disconnectConfirmOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-xl" onClick={() => setDisconnectConfirmOpen(false)} />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="relative w-full max-w-md mx-4 glass-card glow-red gradient-border"
          >
            <div className="flex items-start gap-3 mb-4 p-6 pb-0">
              <div className="w-10 h-10 rounded-xl bg-danger/10 flex items-center justify-center flex-shrink-0 border border-danger/20">
                <AlertTriangle className="w-5 h-5 text-danger" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white font-display">Disconnect Server?</h3>
                <p className="text-sm text-text-secondary mt-1">
                  This will remove the server connection and clear all stored credentials. You'll need to re-enter your API URL to reconnect.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 pt-2">
              <button
                onClick={() => setDisconnectConfirmOpen(false)}
                className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDisconnect}
                className="px-4 py-2 text-sm font-medium bg-danger hover:bg-accent-red text-white rounded-lg transition-colors font-display"
              >
                Disconnect
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
