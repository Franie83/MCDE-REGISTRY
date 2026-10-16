import React from 'react';
import { Correspondence } from '../types';

interface StatsBarProps {
  records: Correspondence[];
  onFilterType?: (type: 'all' | 'incoming' | 'outgoing') => void;
}

export const StatsBar: React.FC<StatsBarProps> = ({ records, onFilterType }) => {
  const incomingCount = records.filter(r => r.type === 'incoming').length;
  const outgoingCount = records.filter(r => r.type === 'outgoing').length;
  
  // Unique file numbers
  const uniqueFiles = new Set(records.map(r => r.fileNumber.trim().toUpperCase())).size;
  
  // Pending action / minuted
  const pendingActionCount = records.filter(r => r.status === 'received' || r.status === 'minuted').length;

  // Total documents attached
  const totalDocsCount = records.reduce((acc, r) => acc + (r.documents?.length || 0), 0);

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6 bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
      <div 
        onClick={() => onFilterType?.('incoming')}
        className="cursor-pointer hover:bg-slate-50 p-2 rounded-lg transition-colors"
      >
        <span className="block text-xs font-medium text-slate-500 mb-1">Inward Letters</span>
        <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">{incomingCount}</span>
        <span className="block text-[11px] text-slate-400 mt-0.5">Received & logged</span>
      </div>

      <div 
        onClick={() => onFilterType?.('outgoing')}
        className="cursor-pointer hover:bg-slate-50 p-2 rounded-lg transition-colors border-l border-slate-100"
      >
        <span className="block text-xs font-medium text-slate-500 mb-1">Outward Letters</span>
        <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">{outgoingCount}</span>
        <span className="block text-[11px] text-slate-400 mt-0.5">Dispatched out</span>
      </div>

      <div className="p-2 border-l border-slate-100">
        <span className="block text-xs font-medium text-slate-500 mb-1">Active File Dockets</span>
        <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">{uniqueFiles}</span>
        <span className="block text-[11px] text-slate-400 mt-0.5">Indexed file folders</span>
      </div>

      <div className="p-2 border-l border-slate-100">
        <span className="block text-xs font-medium text-slate-500 mb-1">Awaiting Treatment</span>
        <span className="text-2xl font-bold text-amber-700 font-mono tabular-nums">{pendingActionCount}</span>
        <span className="block text-[11px] text-slate-400 mt-0.5">Minuted or new</span>
      </div>

      <div className="p-2 border-l border-slate-100">
        <span className="block text-xs font-medium text-slate-500 mb-1">Files Across Letters</span>
        <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">{totalDocsCount}</span>
        <span className="block text-[11px] text-slate-400 mt-0.5">Archived attachments</span>
      </div>
    </div>
  );
};
