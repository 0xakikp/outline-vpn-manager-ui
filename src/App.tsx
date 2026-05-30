import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, LayoutDashboard, Users, BarChart3, Settings,
  RefreshCw, Wifi
} from 'lucide-react';
import { ToastProvider, useToast } from '@/contexts/ToastContext';
import AnimatedBackground from '@/components/AnimatedBackground';
import {
  getServerInfo,
  getAccessKeys,
  getTransferMetrics,
  createKey,
  deleteKey,
  renameKey,
  setDataLimit,
  deleteDataLimit,
  updateServerName,
  updateHostname,
  updatePortForNewAccessKeys,
  type AccessKey,
  type ServerInfo,
  type TransferMetrics,
} from '@/lib/outline-api';
import OverviewTab from '@/sections/OverviewTab';
import KeysTab from '@/sections/KeysTab';
import AnalyticsTab from '@/sections/AnalyticsTab';
import SettingsTab from '@/sections/SettingsTab';

type Tab = 'overview' | 'keys' | 'analytics' | 'settings';

const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'keys', label: 'Keys', icon: Users },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings },
];

function AppContent() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [serverInfo, setServerInfo] = useState<ServerInfo | null>(null);
  const [accessKeys, setAccessKeys] = useState<AccessKey[]>([]);
  const [metrics, setMetrics] = useState<TransferMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { showToast } = useToast();

  const fetchData = useCallback(async () => {
    try {
      const [info, keys, m] = await Promise.all([
        getServerInfo(),
        getAccessKeys(),
        getTransferMetrics(),
      ]);
      setServerInfo(info);
      setAccessKeys(keys);
      setMetrics(m);
    } catch (err) {
      showToast('Failed to fetch data', 'error');
    }
  }, [showToast]);

  const load = useCallback(async () => {
    setLoading(true);
    await fetchData();
    setLoading(false);
  }, [fetchData]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
    showToast('Data refreshed', 'success');
  }, [fetchData, showToast]);

  useEffect(() => {
    load();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [load, fetchData]);

  // Action handlers passed to tabs
  const handleCreateKey = async (name?: string, dataLimit?: { bytes: number }) => {
    const key = await createKey(name, dataLimit);
    await fetchData();
    showToast(`Key "${key.name || key.id}" created`, 'success');
    return key;
  };

  const handleDeleteKey = async (id: string) => {
    await deleteKey(id);
    await fetchData();
    showToast('Key deleted', 'success');
  };

  const handleRenameKey = async (id: string, name: string) => {
    await renameKey(id, name);
    await fetchData();
    showToast('Key renamed', 'success');
  };

  const handleSetDataLimit = async (id: string, bytes: number) => {
    await setDataLimit(id, bytes);
    await fetchData();
    showToast('Data limit updated', 'success');
  };

  const handleDeleteDataLimit = async (id: string) => {
    await deleteDataLimit(id);
    await fetchData();
    showToast('Data limit removed', 'success');
  };

  const handleUpdateServerName = async (name: string) => {
    await updateServerName(name);
    await fetchData();
    showToast('Server name updated', 'success');
  };

  const handleUpdateHostname = async (hostname: string) => {
    await updateHostname(hostname);
    await fetchData();
    showToast('Hostname updated', 'success');
  };

  const handleUpdatePort = async (port: number) => {
    await updatePortForNewAccessKeys(port);
    await fetchData();
    showToast('Port updated', 'success');
  };

  return (
    <div className="min-h-[100dvh] bg-black text-white relative">
      <AnimatedBackground />

      {/* Top Bar */}
      <header className="sticky top-0 z-50 bg-black/60 backdrop-blur-2xl border-b border-border-subtle">
        <div className="flex items-center justify-between px-4 lg:px-6 h-14">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <Shield className="w-6 h-6 text-accent-primary" strokeWidth={1.5} />
              <div className="absolute inset-0 flex items-center justify-center">
                <Wifi className="w-3 h-3 text-white" strokeWidth={2.5} />
              </div>
            </div>
            <span className="font-display font-semibold text-[15px] tracking-tight hidden sm:block">
              Outline Manager
            </span>
          </div>

          {/* Tab Navigation */}
          <nav className="flex items-center gap-1 glass-card p-1 no-padding">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 font-display ${
                    isActive
                      ? 'text-white'
                      : 'text-text-muted hover:text-text-secondary hover:bg-[#161622]'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-bg-glass rounded-lg tab-glow"
                      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </span>
                </button>
              );
            })}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={refresh}
              disabled={refreshing}
              className="p-2 rounded-lg text-text-muted hover:text-white hover:bg-[#161622] transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-success/10 border border-success/20">
              <span className="w-1.5 h-1.5 rounded-full bg-success status-dot" />
              <span className="text-xs font-medium text-success font-display">Connected</span>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Content */}
      <main className="relative z-10 p-4 lg:p-6 max-w-[1400px] mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
          >
            {activeTab === 'overview' && (
              <OverviewTab
                serverInfo={serverInfo}
                accessKeys={accessKeys}
                metrics={metrics}
                loading={loading}
                onCreateKey={handleCreateKey}
              />
            )}
            {activeTab === 'keys' && (
              <KeysTab
                accessKeys={accessKeys}
                metrics={metrics}
                loading={loading}
                onCreateKey={handleCreateKey}
                onDeleteKey={handleDeleteKey}
                onRenameKey={handleRenameKey}
                onSetDataLimit={handleSetDataLimit}
                onDeleteDataLimit={handleDeleteDataLimit}
              />
            )}
            {activeTab === 'analytics' && (
              <AnalyticsTab
                accessKeys={accessKeys}
                metrics={metrics}
                loading={loading}
              />
            )}
            {activeTab === 'settings' && (
              <SettingsTab
                serverInfo={serverInfo}
                accessKeys={accessKeys}
                loading={loading}
                onUpdateServerName={handleUpdateServerName}
                onUpdateHostname={handleUpdateHostname}
                onUpdatePort={handleUpdatePort}
                onDeleteDataLimit={handleDeleteDataLimit}
                onDisconnect={() => {
                  localStorage.removeItem('outline_api_url');
                  localStorage.removeItem('outline_cors_proxy');
                  window.location.reload();
                }}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}
