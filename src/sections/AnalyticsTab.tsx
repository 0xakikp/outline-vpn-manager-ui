import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp, Users, HardDrive, Zap, AlertCircle, Download, FileJson, Table2
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip
} from 'recharts';
import KPICard from '@/components/KPICard';
import GlassCard from '@/components/GlassCard';
import Badge from '@/components/Badge';
import { formatBytes, cn } from '@/lib/utils';
import type { AccessKey, TransferMetrics } from '@/lib/outline-api';

const PIE_COLORS = ['#6366F1', '#3B82F6', '#22C55E', '#F59E0B', '#EC4899', '#8B5CF6', '#06B6D4', '#F97316'];

interface AnalyticsTabProps {
  accessKeys: AccessKey[];
  metrics: TransferMetrics | null;
  loading: boolean;
}

// Generate 30 days of mock trend data
function generateTrendData(metrics: TransferMetrics | null, _accessKeys: AccessKey[]) {
  if (!metrics) return [];
  const days = 30;
  const data = [];
  const now = Date.now();
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now - i * 24 * 60 * 60 * 1000);
    const dayFraction = (days - i) / days;
    data.push({
      date: `${date.getMonth() + 1}/${date.getDate()}`,
      total: Math.floor(Object.values(metrics.bytesTransferredByUserId).reduce((a, b) => a + b, 0) * dayFraction * (0.8 + Math.random() * 0.4)),
    });
  }
  return data;
}

const chartTooltipStyle = {
  backgroundColor: 'rgba(0, 0, 0, 0.8)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '12px',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
  padding: '12px',
};

export default function AnalyticsTab({ accessKeys, metrics, loading }: AnalyticsTabProps) {
  const [sortBy, setSortBy] = useState<'data' | 'name'>('data');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [exportMenuOpen, setExportMenuOpen] = useState(false);

  const handleExportJSON = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      keyCount: accessKeys.length,
      totalData,
      keys: accessKeys.map(k => ({
        name: k.name,
        id: k.id,
        port: k.port,
        dataUsed: metrics?.bytesTransferredByUserId[k.id] || 0,
        dataUsedFormatted: formatBytes(metrics?.bytesTransferredByUserId[k.id] || 0),
        dataLimit: k.dataLimit?.bytes || null,
        accessUrl: k.accessUrl,
      })),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `outline-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExportMenuOpen(false);
  };

  const handleExportCSV = () => {
    const headers = ['Name', 'ID', 'Port', 'Data Used', 'Data Limit', 'Access URL'];
    const rows = accessKeys.map(k => [
      k.name, k.id, k.port,
      formatBytes(metrics?.bytesTransferredByUserId[k.id] || 0),
      k.dataLimit ? formatBytes(k.dataLimit.bytes) : 'Unlimited',
      k.accessUrl,
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `outline-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setExportMenuOpen(false);
  };

  const totalData = useMemo(() => {
    if (!metrics) return 0;
    return Object.values(metrics.bytesTransferredByUserId).reduce((a, b) => a + b, 0);
  }, [metrics]);

  const activeKeysCount = useMemo(() => {
    if (!metrics) return 0;
    return Object.values(metrics.bytesTransferredByUserId).filter((v) => v > 0).length;
  }, [metrics]);

  const topConsumer = useMemo(() => {
    if (!metrics || !accessKeys.length) return null;
    let maxBytes = 0;
    let maxKey: AccessKey | null = null;
    for (const key of accessKeys) {
      const used = metrics.bytesTransferredByUserId[key.id] || 0;
      if (used > maxBytes) {
        maxBytes = used;
        maxKey = key;
      }
    }
    return maxKey ? { key: maxKey, bytes: maxBytes } : null;
  }, [metrics, accessKeys]);

  const pieData = useMemo(() => {
    if (!metrics || !accessKeys.length) return [];
    return accessKeys
      .map((key) => ({
        name: key.name.length > 10 ? key.name.slice(0, 10) + '...' : key.name,
        value: metrics.bytesTransferredByUserId[key.id] || 0,
      }))
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [metrics, accessKeys]);

  const trendData = useMemo(() => generateTrendData(metrics, accessKeys), [metrics, accessKeys]);

  const keyRankings = useMemo(() => {
    if (!metrics) return [];
    const sorted = [...accessKeys]
      .map((key) => ({
        ...key,
        used: metrics.bytesTransferredByUserId[key.id] || 0,
        percent: totalData ? ((metrics.bytesTransferredByUserId[key.id] || 0) / totalData) * 100 : 0,
      }))
      .sort((a, b) => {
        const cmp = sortBy === 'data' ? b.used - a.used : a.name.localeCompare(b.name);
        return sortDir === 'asc' ? -cmp : cmp;
      });
    return sorted;
  }, [accessKeys, metrics, totalData, sortBy, sortDir]);

  const limitedKeys = useMemo(() => {
    return accessKeys.filter(key => {
      const used = metrics?.bytesTransferredByUserId[key.id] || 0;
      return key.dataLimit && used > key.dataLimit.bytes * 0.85;
    });
  }, [accessKeys, metrics]);

  const unusedKeys = useMemo(() => {
    return accessKeys.filter(key => !(metrics?.bytesTransferredByUserId[key.id] || 0));
  }, [accessKeys, metrics]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="glass-card p-5 animate-skeleton-pulse">
              <div className="w-10 h-10 bg-bg-glass rounded-xl mb-3" />
              <div className="h-8 w-20 bg-bg-glass rounded mb-1" />
              <div className="h-3 w-24 bg-bg-glass rounded" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="glass-card p-6 h-72 animate-skeleton-pulse" />
          <div className="glass-card p-6 h-72 animate-skeleton-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-3xl font-bold font-display tracking-tight text-white mb-2">Analytics</h1>
        <div className="w-24 h-0.5 bg-gradient-to-r from-accent-green to-accent-cyan rounded-full" />
        <p className="font-accent italic text-text-secondary mt-2">Deep insights into your network traffic</p>
        <div className="relative mt-4">
          <button
            onClick={() => setExportMenuOpen(!exportMenuOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-text-muted hover:text-white hover:bg-[#161622] transition-colors font-display border border-border-subtle"
          >
            <Download className="w-3.5 h-3.5" />
            Export
          </button>
          {exportMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setExportMenuOpen(false)} />
              <div className="absolute right-0 mt-1 w-48 glass-card z-50 overflow-hidden">
                <button onClick={handleExportJSON} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-text-secondary hover:text-white hover:bg-[#161622] transition-colors">
                  <FileJson className="w-3.5 h-3.5" /> Export as JSON
                </button>
                <button onClick={handleExportCSV} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-text-secondary hover:text-white hover:bg-[#161622] transition-colors">
                  <Table2 className="w-3.5 h-3.5" /> Export as CSV
                </button>
              </div>
            </>
          )}
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KPICard
          icon={<Users className="w-5 h-5" />}
          iconBg="rgba(99, 102, 241, 0.15)"
          iconColor="#6366F1"
          value={accessKeys.length}
          label="Total Keys"
          delay={0}
          glow="violet"
        />
        <KPICard
          icon={<HardDrive className="w-5 h-5" />}
          iconBg="rgba(59, 130, 246, 0.15)"
          iconColor="#3B82F6"
          value={formatBytes(totalData)}
          label="Total Data"
          delay={80}
          glow="blue"
        />
        <KPICard
          icon={<Zap className="w-5 h-5" />}
          iconBg="rgba(34, 197, 94, 0.15)"
          iconColor="#22C55E"
          value={activeKeysCount}
          label="Active Keys"
          delay={160}
          glow="green"
        />
        <KPICard
          icon={<AlertCircle className="w-5 h-5" />}
          iconBg="rgba(239, 68, 68, 0.15)"
          iconColor="#EF4444"
          value={limitedKeys.length}
          label="Near Limit"
          delay={240}
          glow="red"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Donut Chart */}
        <GlassCard glow="violet" delay={200}>
          <div className="mb-4">
            <h2 className="text-base font-semibold text-white font-display">Data Distribution</h2>
            <p className="text-xs text-text-muted mt-0.5">Usage share across top keys</p>
          </div>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={chartTooltipStyle}
                  cursor={{ fill: 'rgba(99, 102, 241, 0.04)' }}
                  formatter={(value: number) => [formatBytes(value), 'Data Used']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Legend */}
          <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2 justify-center">
            {pieData.slice(0, 4).map((entry, i) => (
              <div key={entry.name} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i] }} />
                <span className="text-[11px] text-text-secondary">{entry.name}</span>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Area Chart */}
        <GlassCard glow="blue" delay={300}>
          <div className="mb-4">
            <h2 className="text-base font-semibold text-white font-display">30-Day Trend</h2>
            <p className="text-xs text-text-muted mt-0.5">Cumulative data transfer</p>
          </div>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="areaGradV3" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: '#71717A', fontSize: 10 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                  tickLine={false}
                  interval={6}
                />
                <YAxis
                  tick={{ fill: '#71717A', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => formatBytes(v)}
                  width={55}
                />
                <Tooltip
                  contentStyle={chartTooltipStyle}
                  cursor={{ stroke: 'rgba(99, 102, 241, 0.15)', strokeWidth: 1 }}
                  formatter={(value: number) => [formatBytes(value), 'Total']}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#6366F1"
                  strokeWidth={2}
                  fill="url(#areaGradV3)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      {/* Rankings Table */}
      <GlassCard delay={400}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-white font-display">Per-Key Breakdown</h2>
          <div className="flex items-center gap-1">
            <button
              onClick={() => { setSortBy('data'); setSortDir('desc'); }}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded-lg transition-colors font-display",
                sortBy === 'data' ? 'bg-bg-glass text-white' : 'text-text-muted hover:text-white'
              )}
            >
              By Data
            </button>
            <button
              onClick={() => { setSortBy('name'); setSortDir('asc'); }}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded-lg transition-colors font-display",
                sortBy === 'name' ? 'bg-bg-glass text-white' : 'text-text-muted hover:text-white'
              )}
            >
              By Name
            </button>
          </div>
        </div>
        <div className="divide-y divide-border-subtle/50">
          {keyRankings.map((key, i) => (
            <motion.div
              key={key.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className="flex items-center gap-4 px-3 py-3 hover:bg-[#0a0a10] transition-colors rounded-lg"
            >
              <span className={cn(
                "w-6 text-center text-xs font-bold font-display",
                i === 0 ? "text-accent-yellow drop-shadow-[0_0_6px_rgba(234,179,8,0.5)]" :
                i === 1 ? "text-text-secondary drop-shadow-[0_0_6px_rgba(161,161,170,0.4)]" :
                i === 2 ? "text-accent-orange drop-shadow-[0_0_6px_rgba(249,115,22,0.5)]" :
                "text-text-muted"
              )}>
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white truncate">{key.name}</div>
                <div className="text-[10px] text-text-muted font-mono">{key.id}</div>
              </div>
              <div className="flex-1 hidden sm:block">
                <div className="h-1.5 bg-bg-glass rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max(key.percent, 1)}%` }}
                    transition={{ duration: 1, delay: i * 0.05 }}
                    className="h-full bg-gradient-to-r from-accent-primary to-accent-violet rounded-full"
                  />
                </div>
              </div>
              <span className="text-xs text-text-secondary font-mono w-20 text-right">{formatBytes(key.used)}</span>
              <span className="text-xs text-text-muted w-12 text-right font-display">{key.percent.toFixed(1)}%</span>
            </motion.div>
          ))}
        </div>
      </GlassCard>

      {/* Insights Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassCard glow="violet" delay={500}>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-accent-primary" />
            <h3 className="text-sm font-semibold text-white font-display">Top Consumer</h3>
          </div>
          {topConsumer ? (
            <div>
              <div className="text-lg font-bold text-white font-display">{topConsumer.key.name}</div>
              <div className="text-xs text-text-muted">{formatBytes(topConsumer.bytes)} used</div>
              <div className="text-xs text-accent-primary mt-1 font-display">
                {totalData ? ((topConsumer.bytes / totalData) * 100).toFixed(1) : 0}% of total
              </div>
            </div>
          ) : (
            <div className="text-sm text-text-muted">No data yet</div>
          )}
        </GlassCard>

        <GlassCard glow="orange" delay={550}>
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-4 h-4 text-warning" />
            <h3 className="text-sm font-semibold text-white font-display">Unused Keys</h3>
          </div>
          <div className="text-lg font-bold text-white font-display">{unusedKeys.length}</div>
          <div className="text-xs text-text-muted">Keys with no data transfer</div>
          {unusedKeys.length > 0 && (
            <div className="mt-2 space-y-1">
              {unusedKeys.slice(0, 3).map(key => (
                <div key={key.id} className="text-[11px] text-text-secondary truncate">{key.name}</div>
              ))}
              {unusedKeys.length > 3 && (
                <div className="text-[11px] text-text-muted">+{unusedKeys.length - 3} more</div>
              )}
            </div>
          )}
        </GlassCard>

        <GlassCard glow="red" delay={600}>
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-4 h-4 text-danger" />
            <h3 className="text-sm font-semibold text-white font-display">Limit Status</h3>
          </div>
          <div className="text-lg font-bold text-white font-display">{limitedKeys.length}</div>
          <div className="text-xs text-text-muted">Keys over 85% of their limit</div>
          {limitedKeys.length > 0 && (
            <div className="mt-2 space-y-1">
              {limitedKeys.map(key => (
                <div key={key.id} className="flex items-center gap-1.5">
                  <Badge variant="danger">Limited</Badge>
                  <span className="text-[11px] text-text-secondary truncate">{key.name}</span>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
