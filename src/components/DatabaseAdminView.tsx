/**
 * DatabaseAdminView - super_admin only.
 * Wipe, reseed, or wipe+reseed the database. Users + CMS are preserved.
 */
import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import {
  Database, RefreshCw, Trash2, AlertTriangle,
  Loader2, XCircle, RotateCcw,
} from 'lucide-react';

interface Props {
  onToast?: (message: string) => void;
}

export const DatabaseAdminView: React.FC<Props> = ({ onToast }) => {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [dbName, setDbName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.adminStats();
      setCounts(res.counts || {});
      setDbName(res.database || '');
    } catch (err: any) {
      setError(err?.message || 'Failed to load database stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const runAction = async (label: string, fn: () => Promise<any>) => {
    setWorking(label);
    setError(null);
    try {
      await fn();
      onToast?.(label + ' completed');
      await loadStats();
    } catch (err: any) {
      const msg = err?.message || (label + ' failed');
      setError(msg);
      onToast?.(msg);
    } finally {
      setWorking(null);
    }
  };

  const handleWipe = () => {
    if (!window.confirm(
      'WIPE the database?\n\n' +
      'This permanently deletes ALL correspondence, folders, files, and audit logs.\n' +
      'Users and CMS settings are preserved.\n\n' +
      'This cannot be undone.'
    )) return;
    runAction('Wipe', () => api.adminWipe());
  };

  const handleReseed = () => {
    if (!window.confirm(
      'RESEED the database?\n\n' +
      'This inserts the sample dataset only if the database is empty.\n\n' +
      'Continue?'
    )) return;
    runAction('Reseed', () => api.adminReseed(false));
  };

  const handleWipeReseed = () => {
    if (!window.confirm(
      'WIPE + RESEED the database?\n\n' +
      'This deletes ALL correspondence, folders, files, and audit logs,\n' +
      'then re-inserts the sample dataset.\n\n' +
      'Users and CMS settings are preserved.\n\n' +
      'This cannot be undone.'
    )) return;
    runAction('Wipe + reseed', () => api.adminWipeReseed());
  };

  const statRows: { key: string; label: string }[] = [
    { key: 'correspondence', label: 'Correspondence letters' },
    { key: 'attached_documents', label: 'Attached documents' },
    { key: 'folders', label: 'Archive folders' },
    { key: 'folder_files', label: 'Folder files' },
    { key: 'audit_logs', label: 'Audit log entries' },
    { key: 'users', label: 'User accounts (preserved)' },
    { key: 'cms_settings', label: 'CMS settings (preserved)' },
  ];

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <span>Administration</span>
              <span>.</span>
              <span>Danger Zone</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Database className="w-5 h-5 text-emerald-800" />
              <span>Database Administration</span>
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Wipe, reseed, or reset the registry data. User accounts and CMS settings are always preserved.
            </p>
          </div>
          <button
            onClick={loadStats}
            disabled={loading || !!working}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5 shrink-0"
          >
            <RefreshCw className={'w-3.5 h-3.5 ' + (loading ? 'animate-spin' : '')} />
            <span>Refresh</span>
          </button>
        </div>

        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">These actions are destructive and cannot be undone.</p>
            <p className="mt-0.5">Use them only for testing or to reset the registry before going live.</p>
          </div>
        </div>

        {error && (
          <div className="mt-3 p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-center gap-2">
            <XCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-900">Current state</h3>
          <span className="text-[11px] font-mono text-slate-500">{dbName}</span>
        </div>
        {loading ? (
          <div className="py-8 text-center">
            <Loader2 className="w-5 h-5 text-slate-400 mx-auto animate-spin mb-2" />
            <p className="text-xs text-slate-500">Loading...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {statRows.map((row) => (
              <div key={row.key} className="border border-slate-200 rounded-lg p-3 bg-slate-50/50">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  {row.label}
                </div>
                <div className="text-xl font-bold text-slate-900 font-mono tabular-nums">
                  {counts[row.key] ?? 0}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-3">Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={handleWipe}
            disabled={!!working}
            className="p-4 border border-red-200 hover:border-red-400 hover:bg-red-50 rounded-lg text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-2 mb-1">
              {working === 'Wipe' ? (
                <Loader2 className="w-4 h-4 text-red-700 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4 text-red-700" />
              )}
              <span className="text-xs font-bold text-red-800">Wipe</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-snug">
              Delete all records, folders, files, and audit logs. Users + CMS preserved.
            </p>
          </button>

          <button
            onClick={handleReseed}
            disabled={!!working}
            className="p-4 border border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50 rounded-lg text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-2 mb-1">
              {working === 'Reseed' ? (
                <Loader2 className="w-4 h-4 text-emerald-700 animate-spin" />
              ) : (
                <RotateCcw className="w-4 h-4 text-emerald-700" />
              )}
              <span className="text-xs font-bold text-emerald-800">Reseed</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-snug">
              Insert the sample dataset (only if the DB is empty).
            </p>
          </button>

          <button
            onClick={handleWipeReseed}
            disabled={!!working}
            className="p-4 border border-amber-200 hover:border-amber-400 hover:bg-amber-50 rounded-lg text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-2 mb-1">
              {working === 'Wipe + reseed' ? (
                <Loader2 className="w-4 h-4 text-amber-700 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 text-amber-700" />
              )}
              <span className="text-xs font-bold text-amber-800">Wipe + Reseed</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-snug">
              Full reset to the sample dataset. Users + CMS preserved.
            </p>
          </button>
        </div>

        {working && (
          <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
            <span>Running: {working}...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default DatabaseAdminView;
