import { useState, useMemo, useRef, useEffect, type MouseEvent } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Plus, Pencil, Trash2, X, Check, AlertTriangle, KeyRound, Command
} from 'lucide-react';
import Badge from '@/components/Badge';
import Modal from '@/components/Modal';
import DetailDrawer from '@/components/DetailDrawer';
import { formatBytes, cn } from '@/lib/utils';
import type { AccessKey, TransferMetrics } from '@/lib/outline-api';

interface KeysTabProps {
  accessKeys: AccessKey[];
  metrics: TransferMetrics | null;
  loading: boolean;
  onCreateKey: (name?: string, dataLimit?: { bytes: number }) => Promise<AccessKey>;
  onDeleteKey: (id: string) => Promise<void>;
  onRenameKey: (id: string, name: string) => Promise<void>;
  onSetDataLimit: (id: string, bytes: number) => Promise<void>;
  onDeleteDataLimit: (id: string) => Promise<void>;
}

function TableRow({
  keyData,
  index,
  metrics,
  isSelected,
  onToggleSelect,
  onEdit,
  onDelete,
  onShowDetail,
}: {
  keyData: AccessKey;
  index: number;
  metrics: TransferMetrics | null;
  isSelected: boolean;
  onToggleSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onShowDetail?: () => void;
}) {
  const rowRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const row = rowRef.current;
    if (!row) return;
    const rect = row.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    row.style.setProperty('--mouse-x', `${x}px`);
    row.style.setProperty('--mouse-y', `${y}px`);
  };

  const used = metrics?.bytesTransferredByUserId[keyData.id] || 0;
  const limit = keyData.dataLimit?.bytes || 0;
  const percent = limit ? Math.min((used / limit) * 100, 100) : 0;

  let status: { variant: 'success' | 'warning' | 'danger' | 'default'; label: string } =
    { variant: 'default', label: 'Idle' };
  if (used === 0) status = { variant: 'default', label: 'Idle' };
  else if (keyData.dataLimit && used > keyData.dataLimit.bytes * 0.85) status = { variant: 'danger', label: 'Limited' };
  else if (keyData.dataLimit && used > keyData.dataLimit.bytes * 0.6) status = { variant: 'warning', label: 'Near Limit' };
  else status = { variant: 'success', label: 'Active' };

  return (
    <motion.div
      ref={rowRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.02 }}
      onMouseMove={handleMouseMove}
      className={cn(
        "grid grid-cols-[40px_1fr_100px_120px_140px_100px_80px] gap-2 px-4 py-3 border-b border-border-subtle/50 items-center transition-all duration-200 group relative overflow-hidden",
        "hover:bg-[#0a0a10] hover:border-border-default/30",
        isSelected && "bg-[#0a0a14] border-l-2 border-l-accent-primary/40"
      )}
      style={{
        background: 'radial-gradient(300px circle at var(--mouse-x, -999px) var(--mouse-y, -999px), rgba(99, 102, 241, 0.06), transparent 40%)',
      }}
    >
      <button onClick={onToggleSelect} className="flex items-center justify-center">
        <div className={cn(
          "w-4 h-4 rounded border transition-colors flex items-center justify-center",
          isSelected ? "bg-accent-primary border-accent-primary" : "border-border-default hover:border-text-muted"
        )}>
          {isSelected && <Check className="w-3 h-3 text-white" />}
        </div>
      </button>

      <div
        className="flex items-center gap-2.5 min-w-0 cursor-pointer"
        onClick={(e) => { if (!(e.target as HTMLElement).closest('button')) onShowDetail?.(); }}
      >
        <div className="w-8 h-8 rounded-lg bg-bg-glass flex items-center justify-center flex-shrink-0 border border-border-subtle">
          <KeyRound className="w-3.5 h-3.5 text-text-muted" />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-medium text-white truncate">{keyData.name}</div>
          <div className="text-[10px] text-text-muted font-mono truncate">{keyData.id}</div>
        </div>
      </div>

      <span className="text-xs text-text-secondary font-mono hidden sm:block">{keyData.port}</span>

      <span className="text-xs text-text-secondary hidden md:block">
        {keyData.dataLimit ? formatBytes(keyData.dataLimit.bytes) : <span className="text-text-muted">&mdash;</span>}
      </span>

      <div className="hidden lg:block">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-bg-glass rounded-full overflow-hidden">
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
          <span className="text-[10px] text-text-muted font-mono w-14 text-right">{formatBytes(used)}</span>
        </div>
      </div>

      <div>
        <Badge variant={status.variant} pulse={status.variant === 'success'}>{status.label}</Badge>
      </div>

      <div className="flex items-center justify-end gap-1">
        <button
          onClick={onEdit}
          className="p-1.5 rounded-md text-text-muted hover:text-white hover:bg-[#161622] transition-colors"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onDelete}
          className="p-1.5 rounded-md text-text-muted hover:text-danger hover:bg-danger/10 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
}

export default function KeysTab({
  accessKeys,
  metrics,
  loading,
  onCreateKey,
  onDeleteKey,
  onRenameKey,
  onSetDataLimit,
  onDeleteDataLimit,
}: KeysTabProps) {
  const [search, setSearch] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyLimit, setNewKeyLimit] = useState('');
  const [creating, setCreating] = useState(false);
  const [editingKey, setEditingKey] = useState<AccessKey | null>(null);
  const [editName, setEditName] = useState('');
  const [editLimit, setEditLimit] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingKey, setDeletingKey] = useState<AccessKey | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [detailKey, setDetailKey] = useState<AccessKey | null>(null);
  const [sortField, setSortField] = useState<'name' | 'port' | 'dataUsed'>('dataUsed');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [showEditQr, setShowEditQr] = useState(false);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const filteredKeys = useMemo(() => {
    if (!search) return accessKeys;
    const q = search.toLowerCase();
    return accessKeys.filter(k =>
      k.name.toLowerCase().includes(q) ||
      k.id.toLowerCase().includes(q) ||
      k.port.toString().includes(q)
    );
  }, [accessKeys, search]);

  const sortedKeys = useMemo(() => {
    const sorted = [...filteredKeys];
    sorted.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'name': cmp = a.name.localeCompare(b.name); break;
        case 'port': cmp = a.port - b.port; break;
        case 'dataUsed': cmp = (metrics?.bytesTransferredByUserId[a.id] || 0) - (metrics?.bytesTransferredByUserId[b.id] || 0); break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return sorted;
  }, [filteredKeys, sortField, sortDir, metrics]);

  const handleBulkDelete = async () => {
    for (const id of selectedRows) {
      await onDeleteKey(id);
    }
    setSelectedRows(new Set());
    setBulkDeleteConfirm(false);
  };

  const handleCreateKey = async () => {
    setCreating(true);
    try {
      const limitBytes = newKeyLimit ? parseInt(newKeyLimit) * 1024 * 1024 * 1024 : undefined;
      await onCreateKey(
        newKeyName || undefined,
        limitBytes ? { bytes: limitBytes } : undefined
      );
      setCreateModalOpen(false);
      setNewKeyName('');
      setNewKeyLimit('');
    } finally {
      setCreating(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingKey) return;
    setSavingEdit(true);
    try {
      if (editName !== editingKey.name) {
        await onRenameKey(editingKey.id, editName);
      }
      const limitBytes = editLimit ? parseInt(editLimit) * 1024 * 1024 * 1024 : undefined;
      if (limitBytes) {
        await onSetDataLimit(editingKey.id, limitBytes);
      } else if (editingKey.dataLimit && !editLimit) {
        await onDeleteDataLimit(editingKey.id);
      }
      setEditingKey(null);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingKey) return;
    await onDeleteKey(deletingKey.id);
    setDeletingKey(null);
  };

  const toggleSelect = (id: string) => {
    setSelectedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedRows.size === sortedKeys.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(sortedKeys.map(k => k.id)));
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex-1 h-10 glass-card no-padding animate-skeleton-pulse" />
          <div className="w-32 h-10 glass-card no-padding animate-skeleton-pulse" />
        </div>
        <div className="glass-card no-padding overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3 animate-skeleton-pulse">
              <div className="w-4 h-4 bg-bg-glass rounded" />
              <div className="w-8 h-8 bg-bg-glass rounded-lg" />
              <div className="flex-1 h-4 bg-bg-glass rounded" />
              <div className="w-20 h-4 bg-bg-glass rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-3xl font-bold font-display tracking-tight text-white mb-2">Access Keys</h1>
        <div className="w-24 h-0.5 bg-gradient-to-r from-accent-primary to-accent-violet rounded-full" />
      </motion.div>

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            ref={searchInputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search keys by name, ID, or port..."
            className="w-full pl-10 pr-4 py-2.5 glass-input text-sm"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {!search && <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono text-text-muted bg-bg-glass rounded border border-border-subtle"><Command className="w-2.5 h-2.5" />K</kbd>}
            {search && (
              <button onClick={() => setSearch('')} className="text-text-muted hover:text-white">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium font-display text-white transition-all"
          style={{
            background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
            boxShadow: '0 0 20px rgba(99, 102, 241, 0.3), 0 4px 12px rgba(99, 102, 241, 0.2)',
          }}
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">New Key</span>
        </motion.button>
      </div>

      {/* Bulk Actions */}
      <AnimatePresence>
        {selectedRows.size > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center justify-between px-4 py-2.5 glass-card glow-violet no-padding"
          >
            <span className="text-sm text-accent-hover font-display">{selectedRows.size} selected</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setBulkDeleteConfirm(true)}
                className="px-3 py-1.5 text-xs font-medium bg-danger/10 text-danger hover:bg-danger/20 rounded-lg transition-colors font-display flex items-center gap-1.5"
              >
                <Trash2 className="w-3 h-3" />
                Delete {selectedRows.size}
              </button>
              <button
                onClick={() => setSelectedRows(new Set())}
                className="text-xs text-text-muted hover:text-white transition-colors"
              >
                Clear
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      <div className="glass-card no-padding overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[40px_1fr_100px_120px_140px_100px_80px] gap-2 px-4 py-3 border-b border-border-subtle bg-bg-glass/50">
          <button onClick={selectAll} className="flex items-center justify-center">
            <div className={cn(
              "w-4 h-4 rounded border transition-colors flex items-center justify-center",
              selectedRows.size === sortedKeys.length && sortedKeys.length > 0
                ? "bg-accent-primary border-accent-primary"
                : "border-border-default hover:border-text-muted"
            )}>
              {selectedRows.size === sortedKeys.length && sortedKeys.length > 0 && (
                <Check className="w-3 h-3 text-white" />
              )}
            </div>
          </button>
          <button
            onClick={() => { setSortField('name'); setSortDir(sortField === 'name' && sortDir === 'asc' ? 'desc' : 'asc'); }}
            className="text-xs font-semibold text-text-muted uppercase tracking-wider font-display hover:text-white transition-colors flex items-center gap-1"
          >
            Name {sortField === 'name' && (sortDir === 'asc' ? '↑' : '↓')}
          </button>
          <button
            onClick={() => { setSortField('port'); setSortDir(sortField === 'port' && sortDir === 'asc' ? 'desc' : 'asc'); }}
            className="text-xs font-semibold text-text-muted uppercase tracking-wider hidden sm:block font-display hover:text-white transition-colors flex items-center gap-1"
          >
            Port {sortField === 'port' && (sortDir === 'asc' ? '↑' : '↓')}
          </button>
          <span className="text-xs font-semibold text-text-muted uppercase tracking-wider hidden md:block font-display">Data Limit</span>
          <button
            onClick={() => { setSortField('dataUsed'); setSortDir(sortField === 'dataUsed' && sortDir === 'asc' ? 'desc' : 'asc'); }}
            className="text-xs font-semibold text-text-muted uppercase tracking-wider hidden lg:block font-display hover:text-white transition-colors flex items-center gap-1"
          >
            Data Used {sortField === 'dataUsed' && (sortDir === 'asc' ? '↑' : '↓')}
          </button>
          <span className="text-xs font-semibold text-text-muted uppercase tracking-wider font-display">Status</span>
          <span className="text-xs font-semibold text-text-muted uppercase tracking-wider text-right font-display">Actions</span>
        </div>

        {/* Rows */}
        {sortedKeys.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-bg-glass flex items-center justify-center mb-4 border border-border-subtle">
              <KeyRound className="w-6 h-6 text-text-muted" />
            </div>
            <h3 className="text-base font-medium text-white mb-1 font-display">No keys found</h3>
            <p className="text-sm text-text-muted mb-4">
              {search ? 'Try a different search term' : 'Create your first access key'}
            </p>
            {!search && (
              <button
                onClick={() => setCreateModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-accent-primary hover:bg-accent-hover text-white rounded-lg text-sm font-medium transition-colors font-display"
              >
                <Plus className="w-4 h-4" />
                Create Key
              </button>
            )}
          </div>
        ) : (
          sortedKeys.map((key, i) => (
            <TableRow
              key={key.id}
              keyData={key}
              index={i}
              metrics={metrics}
              isSelected={selectedRows.has(key.id)}
              onToggleSelect={() => toggleSelect(key.id)}
              onEdit={() => { setEditingKey(key); setEditName(key.name); setEditLimit(key.dataLimit ? Math.floor(key.dataLimit.bytes / 1024 / 1024 / 1024).toString() : ''); }}
              onDelete={() => setDeletingKey(key)}
              onShowDetail={() => setDetailKey(key)}
            />
          ))
        )}
      </div>

      {/* Create Key Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => { setCreateModalOpen(false); setNewKeyName(''); setNewKeyLimit(''); }}
        title="Create Access Key"
        footer={
          <>
            <button
              onClick={() => { setCreateModalOpen(false); setNewKeyName(''); setNewKeyLimit(''); }}
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
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Key Name (optional)</label>
            <input
              type="text"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder="e.g. Alice's Laptop"
              className="w-full px-3 py-2.5 glass-input"
              onKeyDown={(e) => e.key === 'Enter' && handleCreateKey()}
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Data Limit (GB, optional)</label>
            <input
              type="number"
              value={newKeyLimit}
              onChange={(e) => setNewKeyLimit(e.target.value)}
              placeholder="e.g. 10"
              min="0"
              className="w-full px-3 py-2.5 glass-input"
            />
          </div>
        </div>
      </Modal>

      {/* Edit Key Modal */}
      <Modal
        isOpen={!!editingKey}
        onClose={() => setEditingKey(null)}
        title="Edit Key"
        footer={
          <>
            <button
              onClick={() => setEditingKey(null)}
              className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveEdit}
              disabled={savingEdit}
              className="px-4 py-2 text-sm font-medium bg-accent-primary hover:bg-accent-hover text-white rounded-lg transition-colors disabled:opacity-50 font-display"
            >
              {savingEdit ? 'Saving...' : 'Save Changes'}
            </button>
          </>
        }
      >
        {editingKey && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Key Name</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-3 py-2.5 glass-input"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Data Limit (GB, leave empty for unlimited)</label>
              <input
                type="number"
                value={editLimit}
                onChange={(e) => setEditLimit(e.target.value)}
                placeholder="Unlimited"
                min="0"
                className="w-full px-3 py-2.5 glass-input"
              />
            </div>
            <div className="pt-2">
              <button
                onClick={() => setShowEditQr(!showEditQr)}
                className="text-xs text-accent-primary hover:text-accent-hover transition-colors"
              >
                {showEditQr ? 'Hide QR Code' : 'Show QR Code'}
              </button>
              {showEditQr && editingKey && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center gap-2 mt-3 p-4 glass-card no-padding"
                >
                  <QRCodeSVG value={editingKey.accessUrl} size={160} level="M" bgColor="transparent" fgColor="#FFFFFF" />
                  <span className="text-[10px] text-text-muted font-mono text-center break-all">{editingKey.accessUrl}</span>
                </motion.div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingKey}
        onClose={() => setDeletingKey(null)}
        title="Delete Key"
        footer={
          <>
            <button
              onClick={() => setDeletingKey(null)}
              className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 text-sm font-medium bg-danger hover:bg-accent-red text-white rounded-lg transition-colors font-display"
            >
              Delete
            </button>
          </>
        }
      >
        {deletingKey && (
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-danger/10 flex items-center justify-center flex-shrink-0 border border-danger/20">
              <AlertTriangle className="w-5 h-5 text-danger" />
            </div>
            <div>
              <p className="text-sm text-text-secondary">
                Are you sure you want to delete <span className="text-white font-medium font-display">"{deletingKey.name}"</span>? This action cannot be undone.
              </p>
            </div>
          </div>
        )}
      </Modal>

      {/* Bulk Delete Confirmation */}
      <Modal
        isOpen={bulkDeleteConfirm}
        onClose={() => setBulkDeleteConfirm(false)}
        title="Delete Selected Keys"
        footer={
          <>
            <button onClick={() => setBulkDeleteConfirm(false)} className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-white transition-colors">Cancel</button>
            <button onClick={handleBulkDelete} className="px-4 py-2 text-sm font-medium bg-danger hover:bg-accent-red text-white rounded-lg transition-colors font-display">Delete {selectedRows.size} Keys</button>
          </>
        }
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-danger/10 flex items-center justify-center flex-shrink-0 border border-danger/20">
            <AlertTriangle className="w-5 h-5 text-danger" />
          </div>
          <p className="text-sm text-text-secondary">
            Are you sure you want to delete <span className="text-white font-medium font-display">{selectedRows.size}</span> selected keys? This action cannot be undone.
          </p>
        </div>
      </Modal>

      <DetailDrawer
        keyData={detailKey}
        metrics={metrics}
        onClose={() => setDetailKey(null)}
        onEdit={() => { if (detailKey) { setEditingKey(detailKey); setEditName(detailKey.name); setEditLimit(detailKey.dataLimit ? Math.floor(detailKey.dataLimit.bytes / 1024 / 1024 / 1024).toString() : ''); } }}
        onDelete={() => { if (detailKey) setDeletingKey(detailKey); }}
      />
    </div>
  );
}
