import React, { useState, useMemo } from 'react';
import { Correspondence, CorrespondenceType } from '../types';
import { formatFileSize, exportToCSV } from '../utils/storage';
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  FileText, 
  Printer, 
  Edit3, 
  Trash2, 
  ArrowDownLeft, 
  ArrowUpRight,
  MoreVertical,
  Plus,
  QrCode
} from 'lucide-react';

interface CorrespondenceTableProps {
  records: Correspondence[];
  activeTypeFilter: 'all' | 'incoming' | 'outgoing';
  onFilterChange: (type: 'all' | 'incoming' | 'outgoing') => void;
  onOpenDocViewer: (record: Correspondence) => void;
  onOpenRoutingSlip: (record: Correspondence) => void;
  onOpenQrCode: (record: Correspondence) => void;
  onEditRecord: (record: Correspondence) => void;
  onDeleteRecord: (id: string) => void;
  onNewRecord: (type: 'incoming' | 'outgoing') => void;
}

export const CorrespondenceTable: React.FC<CorrespondenceTableProps> = ({
  records,
  activeTypeFilter,
  onFilterChange,
  onOpenDocViewer,
  onOpenRoutingSlip,
  onOpenQrCode,
  onEditRecord,
  onDeleteRecord,
  onNewRecord,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedFileFilter, setSelectedFileFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<'recordDate' | 'dateOnCorrespondence' | 'registryNo'>('recordDate');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  // Extract unique document numbers for quick dropdown filter
  const uniqueFileNumbers = useMemo(() => {
    return Array.from(new Set(records.map(r => r.fileNumber.trim()).filter(Boolean)));
  }, [records]);

  // Filtering
  const filteredRecords = useMemo(() => {
    return records.filter((item) => {
      // Type filter
      if (activeTypeFilter !== 'all' && item.type !== activeTypeFilter) {
        return false;
      }
      // Status filter
      if (selectedStatusFilter !== 'all' && item.status !== selectedStatusFilter) {
        return false;
      }
      // Document number filter
      if (selectedFileFilter !== 'all' && item.fileNumber !== selectedFileFilter) {
        return false;
      }
      // Text query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesFile = item.fileNumber.toLowerCase().includes(q);
        const matchesReg = item.registryNo.toLowerCase().includes(q);
        const matchesSource = item.source ? item.source.toLowerCase().includes(q) : false;
        const matchesTarget = item.target ? item.target.toLowerCase().includes(q) : false;
        const matchesOfficer = item.actionOfficer ? item.actionOfficer.toLowerCase().includes(q) : false;
        const matchesDocName = item.documents.some(d => d.name.toLowerCase().includes(q));
        const matchesLocation = item.physicalLocation ? item.physicalLocation.toLowerCase().includes(q) : false;

        if (!matchesTitle && !matchesFile && !matchesReg && !matchesSource && !matchesTarget && !matchesOfficer && !matchesDocName && !matchesLocation) {
          return false;
        }
      }
      return true;
    }).sort((a, b) => {
      let comparison = 0;
      if (sortField === 'recordDate') {
        comparison = new Date(a.recordDate).getTime() - new Date(b.recordDate).getTime();
      } else if (sortField === 'dateOnCorrespondence') {
        comparison = new Date(a.dateOnCorrespondence).getTime() - new Date(b.dateOnCorrespondence).getTime();
      } else if (sortField === 'registryNo') {
        comparison = a.registryNo.localeCompare(b.registryNo);
      }
      return sortAsc ? comparison : -comparison;
    });
  }, [records, activeTypeFilter, selectedStatusFilter, selectedFileFilter, searchQuery, sortField, sortAsc]);

  const handlePrintLedger = () => {
    window.print();
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
      {/* Table Toolbar (Controls) */}
      <div className="no-print p-4 border-b border-slate-200 space-y-3 bg-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Functional Segmented Filter Buttons */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg w-fit">
            <button
              onClick={() => onFilterChange('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                activeTypeFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Registry Records ({records.length})
            </button>
            <button
              onClick={() => onFilterChange('incoming')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                activeTypeFilter === 'incoming'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Inward Mail ({records.filter(r => r.type === 'incoming').length})
            </button>
            <button
              onClick={() => onFilterChange('outgoing')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                activeTypeFilter === 'outgoing'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Outward Mail ({records.filter(r => r.type === 'outgoing').length})
            </button>
          </div>

          {/* Quick Registry Action Tools */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => exportToCSV(filteredRecords)}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5"
              title="Export current registry table to CSV spreadsheet"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={handlePrintLedger}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5"
              title="Print official registry folio ledger"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Ledger</span>
            </button>
          </div>
        </div>

        {/* Search & Secondary Filter Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1">
          {/* Main Search Bar */}
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Document Number, Subject, Source, Target, or Document name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-1 focus:ring-slate-400"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 text-xs"
              >
                Clear
              </button>
            )}
          </div>

          {/* Filter by Document Number */}
          <div className="sm:col-span-3">
            <select
              value={selectedFileFilter}
              onChange={(e) => setSelectedFileFilter(e.target.value)}
              className="w-full text-xs px-2.5 py-2 border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-1 focus:ring-slate-400 font-mono"
            >
              <option value="all">Filter by File No (All)</option>
              {uniqueFileNumbers.map((fn, idx) => (
                <option key={idx} value={fn}>{fn}</option>
              ))}
            </select>
          </div>

          {/* Filter by Status */}
          <div className="sm:col-span-3">
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="w-full text-xs px-2.5 py-2 border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-1 focus:ring-slate-400"
            >
              <option value="all">All Registry Statuses</option>
              <option value="received">Logged into Registry</option>
              <option value="minuted">Minuted to Officer</option>
              <option value="in_treatment">In Treatment</option>
              <option value="dispatched">Dispatched</option>
              <option value="archived">Archived in Jacket</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto w-full">
        <table className="w-full min-w-[1400px] text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <th className="py-3 px-4 whitespace-nowrap">Registry No.</th>
              <th className="py-3 px-4 whitespace-nowrap">Type</th>
              <th 
                className="py-3 px-4 whitespace-nowrap cursor-pointer hover:text-slate-900"
                onClick={() => {
                  if (sortField === 'recordDate') setSortAsc(!sortAsc);
                  else { setSortField('recordDate'); setSortAsc(false); }
                }}
              >
                Date Rec'd / Sent {sortField === 'recordDate' && (sortAsc ? '↑' : '↓')}
              </th>
              <th 
                className="py-3 px-4 whitespace-nowrap cursor-pointer hover:text-slate-900"
                onClick={() => {
                  if (sortField === 'dateOnCorrespondence') setSortAsc(!sortAsc);
                  else { setSortField('dateOnCorrespondence'); setSortAsc(false); }
                }}
              >
                Date on Letter {sortField === 'dateOnCorrespondence' && (sortAsc ? '↑' : '↓')}
              </th>
              <th className="py-3 px-4 whitespace-nowrap">Document Number</th>
              <th className="py-3 px-4 w-[280px]">Title / Subject</th>
              <th className="py-3 px-4 w-[200px]">Source / Target</th>
              <th className="py-3 px-4 whitespace-nowrap w-[100px]">Documents</th>
              <th className="py-3 px-4 w-[180px]">Filing & Location</th>
              <th className="py-3 px-4 text-right no-print whitespace-nowrap w-[220px]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/80 bg-white">
            {filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-12 text-center text-slate-500">
                  <div className="max-w-xs mx-auto space-y-2">
                    <FileText className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="font-semibold text-slate-800">No correspondence records found</p>
                    <p className="text-xs text-slate-400">
                      {searchQuery ? 'Try adjusting your search criteria or clear the filters.' : 'Click Log Inward Letter or Log Outward above to register the first entry.'}
                    </p>
                    <button
                      onClick={() => onNewRecord('incoming')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-2xs mt-2"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Log Inward Letter</span>
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              filteredRecords.map((rec) => {
                const isIncoming = rec.type === 'incoming';
                return (
                  <tr 
                    key={rec.id} 
                    className="hover:bg-slate-50/60 transition-colors group"
                  >
                    {/* Registry No */}
                    <td className="py-3 px-4 whitespace-nowrap font-mono font-bold text-slate-900 tabular-nums">
                      {rec.registryNo}
                    </td>

                    {/* Type indicator */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className={`p-1 rounded-sm ${isIncoming ? 'text-blue-700 bg-blue-50' : 'text-emerald-700 bg-emerald-50'}`}>
                          {isIncoming ? <ArrowDownLeft className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                        </span>
                        <span className="font-medium text-slate-700 capitalize">
                          {isIncoming ? 'Inward' : 'Outward'}
                        </span>
                      </div>
                    </td>

                    {/* Record Date (Received Date or Outgoing Date) */}
                    <td className="py-3 px-4 whitespace-nowrap font-mono text-slate-800 tabular-nums">
                      {rec.recordDate}
                    </td>

                    {/* Date on Correspondence */}
                    <td className="py-3 px-4 whitespace-nowrap font-mono text-slate-500 tabular-nums">
                      {rec.dateOnCorrespondence}
                    </td>

                    {/* Document Number */}
                    <td className="py-3 px-4 whitespace-nowrap font-mono font-semibold text-slate-800">
                      {rec.fileNumber}
                    </td>

                    {/* Title / Subject */}
                    <td className="py-3 px-4 align-top">
                      <p className="font-semibold text-slate-900 leading-relaxed max-w-[280px] whitespace-normal break-words">
                        {rec.title}
                      </p>
                      {rec.remarks && (
                        <p className="text-[11px] text-slate-500 italic mt-0.5 max-w-[280px] whitespace-normal break-words">
                          {rec.remarks}
                        </p>
                      )}
                    </td>

                    {/* Source / Target */}
                    <td className="py-3 px-4 align-top">
                      <p className="font-medium text-slate-800 max-w-[200px] whitespace-normal break-words">
                        {isIncoming ? (rec.source || 'N/A') : (rec.target || 'N/A')}
                      </p>
                      {rec.actionOfficer && (
                        <p className="text-[11px] text-slate-500 max-w-[200px] whitespace-normal break-words">
                          Officer: {rec.actionOfficer}
                        </p>
                      )}
                    </td>

                    {/* Attached Documents with Multi-Document Preview trigger */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {rec.documents.length === 0 ? (
                        <span className="text-slate-400 text-xs">No docs</span>
                      ) : (
                        <button
                          onClick={() => onOpenDocViewer(rec)}
                          className="px-2.5 py-1 text-xs font-medium text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors inline-flex items-center gap-1.5 shadow-2xs"
                          title="View attached documents"
                        >
                          <FileText className="w-3.5 h-3.5 text-slate-600" />
                          <span>{rec.documents.length} {rec.documents.length === 1 ? 'doc' : 'docs'}</span>
                        </button>
                      )}
                    </td>

                    {/* Physical Location & Folio */}
                    <td className="py-3 px-4 align-top w-[180px]">
                      <p className="text-slate-700 max-w-[180px] whitespace-normal break-words">
                        {rec.physicalLocation || 'Central Archive'}
                      </p>
                      {rec.folioNumber && (
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {rec.folioNumber}
                        </p>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right no-print whitespace-nowrap align-top w-[220px]">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        <button
                          onClick={() => onOpenDocViewer(rec)}
                          className="px-2.5 py-1 text-xs font-semibold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors inline-flex items-center gap-1 shadow-2xs"
                          title="Preview letter and attached documents in-browser without downloading"
                        >
                          <Eye className="w-3.5 h-3.5 text-emerald-800" />
                          <span>Preview</span>
                        </button>
                        <button
                          onClick={() => onOpenRoutingSlip(rec)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 rounded-md hover:bg-slate-100 transition-colors"
                          title="Print Routing Slip"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onOpenQrCode(rec)}
                          className="p-1.5 text-slate-500 hover:text-emerald-800 rounded-md hover:bg-emerald-50 transition-colors"
                          title="Generate & View Scannable QR Code"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onEditRecord(rec)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 rounded-md hover:bg-slate-100 transition-colors"
                          title="Edit Record"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteRecord(rec.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer info */}
      <div className="p-3 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
        <div>
          Showing <span className="font-semibold text-slate-800">{filteredRecords.length}</span> of{' '}
          <span className="font-semibold text-slate-800">{records.length}</span> registry items
        </div>
        <div className="text-[11px] text-slate-400">
          Edo State MOCDE Central Registry & Archival Ledger
        </div>
      </div>
    </div>
  );
};

// CORRESPONDENCE_TABLE_PADDING_FIXED
