import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Users, HardDrive, Activity, Server, Plus, Download, ExternalLink, Check, AlertTriangle
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell
} from 'recharts';
import KPICard from '@/components/KPICard';
import GlassCard from '@/components/GlassCard';
import Badge from '@/components/Badge';
import Modal from '@/components/Modal';
import CopyButton from '@/components/CopyButton';
import { formatBytes, formatDate } from '@/lib/utils';
import type { AccessKey, ServerInfo, TransferMetrics } from '@/lib/outline-api';

const chartColors = ['#6366F1', '#3B82F6', '#22C55E', '#F59E0B', '#EC4899', '#8B5CF6'];

const chartTooltipStyle = {
  backgroundColor: 'rgba(0, 0, 0, 0.8)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '12px',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
  padding: '12px',
};

interface OverviewTabProps {
  serverInfo: ServerInfo | null;
  accessKeys: AccessKey[];
  metrics: TransferMetrics | null;
  loading: boolean;
  onCreateKey: (name?: string, dataLimit?: { bytes: number }) => Promise<AccessKey>;
}

export default function OverviewTab({
  serverInfo,
  accessKeys,
  metrics,
  loading,
  onCreateKey,
}: OverviewTabProps) {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [creating, setCreating] = useState(false);
  const [showAccessUrl, setShowAccessUrl] = useState<string | null>(null);

  const totalDataTransferred = useMemo(() => {
    if (!metrics) return 0;
    return Object.values(metrics.bytesTransferredByUserId).reduce((a, b) => a + b, 0);
  }, [metrics]);

  const activeKeysCount = useMemo(() => {
    if (!metrics) return 0;
    return Object.values(metrics.bytesTransferredByUserId).filter((v) => v > 0).length;
  }, [metrics]);

  const chartData = useMemo(() => {
    if (!metrics || !accessKeys.length) return [];
    return accessKeys
      .map((key) => ({
        name: key.name.length > 12 ? key.name.slice(0, 12) + '...' : key.name,
        bytes: metrics.bytesTransferredByUserId[key.id] || 0,
      }))
      .filter((d) => d.bytes > 0)
      .sort((a, b) => b.bytes - a.bytes)
      .slice(0, 6);
  }, [metrics, accessKeys]);

  const recentKeys = useMemo(() => {
    return [...accessKeys].sort((a, b) => b.createdAt - a.createdAt).slice(0, 5);
  }, [accessKeys]);

  const getKeyStatus = (key: AccessKey) => {
    const used = metrics?.bytesTransferredByUserId[key.id] || 0;
    if (used === 0) return { variant: 'default' as const, label: 'Idle' };
    if (key.dataLimit && used > key.dataLimit.bytes * 0.85) return { variant: 'warning' as const, label: 'Near Limit' };
    return { variant: 'success' as const, label: 'Active' };
  };

  const handleCreateKey = async () => {
    setCreating(true);
    try {
      await onCreateKey(newKeyName || undefined);
      setCreateModalOpen(false);
      setNewKeyName('');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="glass-card p-5 animate-skeleton-pulse">
              <div className="w-10 h-10 rounded-xl bg-bg-glass mb-3" />
              <div className="h-8 w-20 bg-bg-glass rounded mb-1" />
              <div className="h-3 w-24 bg-bg-glass rounded" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 glass-card p-6 h-80 animate-skeleton-pulse" />
          <div className="glass-card p-6 h-80 animate-skeleton-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold font-display tracking-tight text-white mb-2">
          Server Overview
        </h1>
        <div className="w-32 h-0.5 bg-gradient-to-r from-accent-violet to-accent-pink rounded-full mb-3" />
        <p className="font-accent italic text-text-secondary text-lg">
          Monitor your VPN infrastructure at a glance
        </p>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KPICard
          icon={<Users className="w-5 h-5" />}
          iconBg="rgba(139, 92, 246, 0.15)"
          iconColor="#8B5CF6"
          value={accessKeys.length}
          label="Total Keys"
          delay={0}
          glow="violet"
        />
        <KPICard
          icon={<HardDrive className="w-5 h-5" />}
          iconBg="rgba(59, 130, 246, 0.15)"
          iconColor="#3B82F6"
          value={formatBytes(totalDataTransferred)}
          label="Total Data"
          trend="+8%"
          trendUp={true}
          delay={80}
          glow="blue"
        />
        <KPICard
          icon={<Activity className="w-5 h-5" />}
          iconBg="rgba(34, 197, 94, 0.15)"
          iconColor="#22C55E"
          value={activeKeysCount}
          label="Active Keys"
          delay={160}
          glow="green"
        />
        <KPICard
          icon={<Server className="w-5 h-5" />}
          iconBg="rgba(249, 115, 22, 0.15)"
          iconColor="#F97316"
          value={serverInfo?.version || '1.10.0'}
          label="Server Version"
          delay={240}
          glow="orange"
        />
      </div>

      {/* Charts + Recent Keys */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Bar Chart */}
        <GlassCard glow="cyan" delay={200} className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-white font-display">Data Usage by Key</h2>
              <p className="text-xs text-text-muted mt-0.5">Top 6 consumers</p>
            </div>
            <button className="flex items-center justify-center w-8 h-8 rounded-lg text-text-muted hover:text-white hover:bg-[#161622] transition-colors">
              <Download className="w-4 h-4" />
            </button>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: '#71717A', fontSize: 11 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#71717A', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => formatBytes(v)}
                  width={60}
                />
                <Tooltip
                  contentStyle={chartTooltipStyle}
                  cursor={{ fill: 'rgba(99, 102, 241, 0.04)' }}
                  labelStyle={{ color: '#FFFFFF', fontSize: 12, fontWeight: 600 }}
                  itemStyle={{ color: '#A1A1AA', fontSize: 12 }}
                  formatter={(value: number) => [formatBytes(value), 'Data Used']}
                />
                <Bar dataKey="bytes" radius={[6, 6, 0, 0]}>
                  {chartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Recent Keys */}
        <GlassCard glow="pink" delay={350}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-white font-display">Recent Keys</h2>
            <span className="text-xs text-text-muted">{recentKeys.length} of {accessKeys.length}</span>
          </div>
          <div className="space-y-2">
            {recentKeys.map((key, i) => {
              const status = getKeyStatus(key);
              const used = metrics?.bytesTransferredByUserId[key.id] || 0;
              return (
                <motion.div
                  key={key.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.4 + i * 0.05 }}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-bg-glass hover:bg-bg-card-hover transition-all group cursor-pointer border border-transparent hover:border-border-default"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-bg-elevated flex items-center justify-center flex-shrink-0">
                      <span className="text-[10px] font-bold text-text-muted font-display">{key.port.toString().slice(-2)}</span>
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-white truncate">{key.name}</div>
                      <div className="text-[11px] text-text-muted">{formatDate(key.createdAt)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[11px] text-text-muted font-mono">{formatBytes(used)}</span>
                    <Badge variant={status.variant} pulse={status.variant === 'success'}>{status.label}</Badge>
                    <button
                      onClick={() => setShowAccessUrl(key.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-text-muted hover:text-accent-primary"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </GlassCard>
      </div>

      {/* Data Limit Alerts */}
      {(() => {
        const alertKeys = accessKeys.filter(key => {
          const used = metrics?.bytesTransferredByUserId[key.id] || 0;
          return key.dataLimit && used > key.dataLimit.bytes * 0.7;
        }).map(key => {
          const used = metrics?.bytesTransferredByUserId[key.id] || 0;
          const limit = key.dataLimit!.bytes;
          const percent = (used / limit) * 100;
          return { ...key, used, limit, percent };
        }).sort((a, b) => b.percent - a.percent);

        if (alertKeys.length === 0) {
          return (
            <GlassCard glow="green" delay={400}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center">
                  <Check className="w-4 h-4 text-success" />
                </div>
                <div>
                  <div className="text-sm font-medium text-white font-display">All keys are within limits</div>
                  <div className="text-xs text-text-muted">No action needed</div>
                </div>
              </div>
            </GlassCard>
          );
        }

        return (
          <GlassCard glow="orange" delay={400}>
            <h3 className="text-sm font-semibold text-white mb-3 font-display flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-warning" />
              Data Limit Alerts ({alertKeys.length})
            </h3>
            <div className="space-y-3">
              {alertKeys.map(key => (
                <div key={key.id} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">{key.name}</div>
                    <div className="text-[11px] text-text-muted font-mono">
                      {formatBytes(key.used)} / {formatBytes(key.limit)} ({Math.round(key.percent)}%)
                    </div>
                  </div>
                  <div className="flex-1 hidden sm:block">
                    <div className="h-1.5 bg-bg-glass rounded-full overflow-hidden">
                      <div
                        className={key.percent > 85 ? "h-full rounded-full bg-danger" : "h-full rounded-full bg-warning"}
                        style={{ width: `${Math.min(key.percent, 100)}%` }}
                      />
                    </div>
                  </div>
                  <Badge variant={key.percent > 85 ? 'danger' : 'warning'}>{key.percent > 85 ? 'Critical' : 'Warning'}</Badge>
                </div>
              ))}
            </div>
          </GlassCard>
        );
      })()}

      {/* Create Key FAB */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.5, type: 'spring', stiffness: 300, damping: 20 }}
        onClick={() => setCreateModalOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-5 py-3.5 rounded-full font-display font-medium text-sm shadow-lg transition-all hover:scale-105"
        style={{
          background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
          boxShadow: '0 0 20px rgba(99, 102, 241, 0.4), 0 4px 24px rgba(99, 102, 241, 0.3)',
        }}
      >
        <Plus className="w-5 h-5" />
        <span>New Key</span>
      </motion.button>

      {/* Create Key Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => { setCreateModalOpen(false); setNewKeyName(''); }}
        title="Create Access Key"
        footer={
          <>
            <button
              onClick={() => { setCreateModalOpen(false); setNewKeyName(''); }}
              className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateKey}
              disabled={creating}
              className="px-4 py-2 text-sm font-medium bg-accent-primary hover:bg-accent-hover text-white rounded-lg transition-colors disabled:opacity-50 font-display"
            >
              {creating ? 'Creating...' : 'Create Key'}
            </button>
          </>
        }
      >
        <label className="block text-sm font-medium text-text-secondary mb-2">
          Key Name (optional)
        </label>
        <input
          type="text"
          value={newKeyName}
          onChange={(e) => setNewKeyName(e.target.value)}
          placeholder="e.g. Alice's Laptop"
          className="w-full px-3 py-2.5 glass-input"
          onKeyDown={(e) => e.key === 'Enter' && handleCreateKey()}
          autoFocus
        />
      </Modal>

      {/* Access URL Modal */}
      <Modal
        isOpen={!!showAccessUrl}
        onClose={() => setShowAccessUrl(null)}
        title="Access URL"
        maxWidth="560px"
      >
        {showAccessUrl && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-3 glass-card no-padding">
              <code className="flex-1 text-xs text-text-secondary font-mono break-all">
                {accessKeys.find(k => k.id === showAccessUrl)?.accessUrl}
              </code>
              <CopyButton
                text={accessKeys.find(k => k.id === showAccessUrl)?.accessUrl || ''}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
