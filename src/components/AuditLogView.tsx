import React, { useState, useMemo } from 'react';
import { AuditLogEntry, AuditActionType } from '../types';
import { exportAuditLogsToCSV } from '../utils/storage';
import { 
  ShieldCheck, 
  Search, 
  Filter, 
  Download, 
  Printer, 
  Clock, 
  User, 
  FileText, 
  Folder, 
  Settings, 
  Trash2, 
  Edit3, 
  Plus, 
  QrCode,
  Calendar,
  AlertTriangle
} from 'lucide-react';

interface AuditLogViewProps {
  logs: AuditLogEntry[];
  onClearLogs?: () => void;
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({ logs, onClearLogs }) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedActionFilter, setSelectedActionFilter] = useState<string>('all');
  const [selectedActorFilter, setSelectedActorFilter] = useState<string>('all');

  // Extract unique actors
  const uniqueActors = useMemo(() => {
    return Array.from(new Set(logs.map(l => l.actor))).filter(Boolean);
  }, [logs]);

  // Filter logs
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      // Action filter
      if (selectedActionFilter !== 'all') {
        if (selectedActionFilter === 'CORRESPONDENCE' && !log.action.includes('CORRESPONDENCE')) return false;
        if (selectedActionFilter === 'FOLDER' && !log.action.includes('FOLDER')) return false;
        if (selectedActionFilter === 'DELETE' && !log.action.includes('DELETE')) return false;
        if (selectedActionFilter === 'CMS' && !log.action.includes('CMS')) return false;
        if (selectedActionFilter === 'QR' && !log.action.includes('QR')) return false;
      }

      // Actor filter
      if (selectedActorFilter !== 'all' && log.actor !== selectedActorFilter) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesRef = log.entityRef.toLowerCase().includes(q);
        const matchesTitle = log.title.toLowerCase().includes(q);
        const matchesDetails = log.details.toLowerCase().includes(q);
        const matchesActor = log.actor.toLowerCase().includes(q);
        const matchesAction = log.action.toLowerCase().includes(q);

        if (!matchesRef && !matchesTitle && !matchesDetails && !matchesActor && !matchesAction) {
          return false;
        }
      }
      return true;
    });
  }, [logs, selectedActionFilter, selectedActorFilter, searchQuery]);

  const handlePrint = () => {
    window.print();
  };

  const getActionBadge = (action: AuditActionType) => {
    switch (action) {
      case 'CREATE_CORRESPONDENCE':
        return <span className="text-emerald-800 font-semibold text-[10px] uppercase font-mono">Create Letter</span>;
      case 'UPDATE_CORRESPONDENCE':
        return <span className="text-blue-800 font-semibold text-[10px] uppercase font-mono">Update Letter</span>;
      case 'DELETE_CORRESPONDENCE':
        return <span className="text-red-700 font-semibold text-[10px] uppercase font-mono">Delete Record</span>;
      case 'CREATE_FOLDER':
        return <span className="text-emerald-800 font-semibold text-[10px] uppercase font-mono">Create Folder</span>;
      case 'MOVE_TO_FOLDER':
        return <span className="text-purple-800 font-semibold text-[10px] uppercase font-mono">Folder Move</span>;
      case 'DELETE_FOLDER':
        return <span className="text-red-700 font-semibold text-[10px] uppercase font-mono">Delete Folder</span>;
      case 'GENERATE_QR':
        return <span className="text-indigo-800 font-semibold text-[10px] uppercase font-mono">Generate QR</span>;
      case 'UPDATE_CMS_SETTINGS':
        return <span className="text-amber-800 font-semibold text-[10px] uppercase font-mono">CMS Update</span>;
      default:
        return <span className="text-slate-700 font-semibold text-[10px] uppercase font-mono">{action.replace(/_/g, ' ')}</span>;
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header & Accountability Statement */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <span>Public Service Compliance & Integrity</span>
              <span>·</span>
              <span>Tamper-Evident Activity Register</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-800" />
              <span>Ministerial Registry Audit Trail</span>
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Tracks the creation, modifications, deletions of letters, and folder movements to guarantee transparent accountability across the Ministry.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => exportAuditLogsToCSV(filteredLogs)}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Audit CSV</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Audit Report</span>
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-4">
          <div className="md:col-span-6 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search audit trail by reference number, subject, officer name, or action details..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg bg-slate-50/50 hover:bg-white focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-400"
            />
          </div>

          <div className="md:col-span-3">
            <select
              value={selectedActionFilter}
              onChange={(e) => setSelectedActionFilter(e.target.value)}
              className="w-full text-xs px-3 py-2.5 border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-400"
            >
              <option value="all">All Registry Actions ({logs.length})</option>
              <option value="CORRESPONDENCE">Letter Registrations & Edits</option>
              <option value="FOLDER">Folder & File Movements</option>
              <option value="DELETE">Deletions & Removals</option>
              <option value="QR">QR Code Verifications</option>
              <option value="CMS">Ministry CMS Updates</option>
            </select>
          </div>

          <div className="md:col-span-3">
            <select
              value={selectedActorFilter}
              onChange={(e) => setSelectedActorFilter(e.target.value)}
              className="w-full text-xs px-3 py-2.5 border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-400"
            >
              <option value="all">All Registry Officers</option>
              {uniqueActors.map((actor, idx) => (
                <option key={idx} value={actor}>{actor}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-3 mt-3 border-t border-slate-100 font-mono">
          <span>Logged Audit Records: <strong className="text-slate-900 tabular-nums">{logs.length}</strong></span>
          <span>·</span>
          <span>Matching Filters: <strong className="text-emerald-900 tabular-nums">{filteredLogs.length}</strong></span>
          <span>·</span>
          <span>Accountability Protocol: <strong className="text-slate-700 font-sans">Edo State Public Service Standards</strong></span>
        </div>
      </div>

      {/* Main Audit Logs Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full min-w-[1200px] text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 whitespace-nowrap">Timestamp</th>
                <th className="py-3 px-4 whitespace-nowrap">Action Type</th>
                <th className="py-3 px-4 whitespace-nowrap">Officer / Actor</th>
                <th className="py-3 px-4 whitespace-nowrap">Entity Reference</th>
                <th className="py-3 px-4 min-w-[220px]">Subject / Description</th>
                <th className="py-3 px-4 w-[280px] max-w-[320px]">Audit Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <ShieldCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">No audit records match your filters</p>
                    <p className="text-xs text-slate-400 mt-0.5">Try clearing the search query or selecting all actions.</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Timestamp */}
                    <td className="py-3 px-4 whitespace-nowrap font-mono text-slate-600 tabular-nums text-[11px]">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {getActionBadge(log.action)}
                    </td>

                    {/* Officer */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-medium text-slate-900 truncate">
                        {log.actor}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {log.actorRole}
                      </div>
                    </td>

                    {/* Reference */}
                    <td className="py-3 px-4 whitespace-nowrap font-mono font-bold text-slate-900">
                      {log.entityRef}
                    </td>

                    {/* Subject */}
                    <td className="py-3 px-4 align-top">
                      <p className="font-medium text-slate-900 max-w-[240px] whitespace-normal break-words">
                        {log.title}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {log.workstation}
                      </p>
                    </td>

                    {/* Audit Details */}
                    <td className="py-3 px-4 text-slate-700 text-xs leading-relaxed align-top">
                      <div className="max-w-[320px] whitespace-normal break-words">
                        {log.details}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Audit Footer */}
        <div className="p-3 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing <strong className="text-slate-800 tabular-nums">{filteredLogs.length}</strong> of{' '}
            <strong className="text-slate-800 tabular-nums">{logs.length}</strong> audit log entries
          </div>
          <div className="text-[11px] text-slate-400">
            Immutable Audit Trail · Edo State Ministry of Communication & Digital Economy
          </div>
        </div>
      </div>
    </div>
  );
};

// AUDIT_TABLE_PADDING_FIXED
