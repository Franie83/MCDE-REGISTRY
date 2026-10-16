import React, { useState, useMemo } from 'react';
import { Correspondence, AttachedDocument } from '../types';
import { File, FileText, ArrowDownLeft, ArrowUpRight, Search, Download, Eye, Calendar, Printer } from 'lucide-react';
import { formatFileSize } from '../utils/storage';

interface FileDocketViewProps {
  records: Correspondence[];
  onOpenDocViewer: (record: Correspondence) => void;
  onOpenRoutingSlip: (record: Correspondence) => void;
  onEditRecord: (record: Correspondence) => void;
}

export interface DocketGroup {
  fileNumber: string;
  records: Correspondence[];
  totalDocs: number;
  lastActivity: string;
  physicalLocation: string;
}

export const FileDocketView: React.FC<FileDocketViewProps> = ({
  records,
  onOpenDocViewer,
  onOpenRoutingSlip,
  onEditRecord,
}) => {
  const [searchDocket, setSearchDocket] = useState<string>('');
  const [selectedFileNumber, setSelectedFileNumber] = useState<string>('');

  // Group records by Document Number
  const docketGroups = useMemo<DocketGroup[]>(() => {
    const map = new Map<string, Correspondence[]>();
    for (const r of records) {
      const fn = r.fileNumber.trim().toUpperCase() || 'UNCLASSIFIED';
      if (!map.has(fn)) {
        map.set(fn, []);
      }
      map.get(fn)!.push(r);
    }

    const groups: DocketGroup[] = [];
    map.forEach((recs, fn) => {
      // Sort chronological
      recs.sort((a, b) => new Date(b.recordDate).getTime() - new Date(a.recordDate).getTime());
      const totalDocs = recs.reduce((sum, item) => sum + (item.documents?.length || 0), 0);
      const lastActivity = recs[0]?.recordDate || '';
      const physicalLocation = recs.find(r => r.physicalLocation)?.physicalLocation || 'Central Archive';
      groups.push({
        fileNumber: fn,
        records: recs,
        totalDocs,
        lastActivity,
        physicalLocation,
      });
    });

    // Sort by most recently active
    return groups.sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime());
  }, [records]);

  // Filter groups
  const filteredGroups = useMemo(() => {
    if (!searchDocket.trim()) return docketGroups;
    const q = searchDocket.toLowerCase();
    return docketGroups.filter(g => 
      g.fileNumber.toLowerCase().includes(q) ||
      g.records.some(r => 
        r.title.toLowerCase().includes(q) || 
        (r.source && r.source.toLowerCase().includes(q)) ||
        (r.target && r.target.toLowerCase().includes(q))
      )
    );
  }, [docketGroups, searchDocket]);

  // Default active selection
  const activeDocket = useMemo(() => {
    if (selectedFileNumber) {
      return docketGroups.find(g => g.fileNumber === selectedFileNumber) || filteredGroups[0];
    }
    return filteredGroups[0];
  }, [selectedFileNumber, docketGroups, filteredGroups]);

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
      {/* Docket Header */}
      <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <File className="w-4 h-4 text-slate-700" />
            <span>Master Document Dockets ({docketGroups.length} Indexed Jackets)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Cross-reference incoming and outgoing correspondence filed under the same Document Number
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Document Number or Subject..."
            value={searchDocket}
            onChange={(e) => setSearchDocket(e.target.value)}
            className="w-full text-xs pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-1 focus:ring-slate-400"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[500px]">
        {/* Left Column: List of Document Dockets */}
        <div className="lg:col-span-4 border-r border-slate-200 bg-slate-50/40 p-2 overflow-y-auto max-h-[600px] space-y-1">
          {filteredGroups.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No matching document docket found.
            </div>
          ) : (
            filteredGroups.map((group) => {
              const isSelected = activeDocket?.fileNumber === group.fileNumber;
              const incomingCount = group.records.filter(r => r.type === 'incoming').length;
              const outgoingCount = group.records.filter(r => r.type === 'outgoing').length;

              return (
                <button
                  key={group.fileNumber}
                  onClick={() => setSelectedFileNumber(group.fileNumber)}
                  className={`w-full text-left p-3 rounded-lg text-xs transition-colors border ${
                    isSelected
                      ? 'bg-white border-slate-400 shadow-2xs'
                      : 'bg-white/60 border-slate-200 hover:bg-white text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono font-bold text-slate-900 truncate">
                      {group.fileNumber}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {group.lastActivity}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 line-clamp-1 mb-2">
                    {group.records[0]?.title}
                  </p>

                  <div className="flex items-center gap-2 text-[10px] text-slate-500">
                    <span>{group.records.length} letters ({incomingCount} in / {outgoingCount} out)</span>
                    <span>·</span>
                    <span>{group.totalDocs} docs</span>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Right Column: Complete Correspondence Thread in Selected Document Docket */}
        <div className="lg:col-span-8 p-6 overflow-y-auto max-h-[600px]">
          {!activeDocket ? (
            <div className="h-full flex items-center justify-center text-center p-8 text-slate-400">
              <p className="text-xs">Select a document docket on the left to view correspondence thread</p>
            </div>
          ) : (
            <div>
              {/* Docket Overview Box */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Document Docket Jacket
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 font-mono">
                      {activeDocket.fileNumber}
                    </h3>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="text-xs text-slate-500 block">Physical Location</span>
                    <span className="text-xs font-semibold text-slate-800">
                      {activeDocket.physicalLocation}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-600 pt-2 border-t border-slate-200">
                  <span>{activeDocket.records.length} Total Letters</span>
                  <span>·</span>
                  <span>{activeDocket.totalDocs} Attached Enclosures</span>
                  <span>·</span>
                  <span>Latest Entry: {activeDocket.lastActivity}</span>
                </div>
              </div>

              {/* Chronological Correspondence Stream */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Chronological Letters in this File
                </h4>

                {activeDocket.records.map((rec) => (
                  <div
                    key={rec.id}
                    className="border border-slate-200 rounded-xl p-4 bg-white shadow-2xs hover:border-slate-300 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex items-start gap-2.5">
                        <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                          rec.type === 'incoming' 
                            ? 'bg-blue-50 text-blue-700' 
                            : 'bg-emerald-50 text-emerald-700'
                        }`}>
                          {rec.type === 'incoming' ? (
                            <ArrowDownLeft className="w-4 h-4" />
                          ) : (
                            <ArrowUpRight className="w-4 h-4" />
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                            <span className="font-mono font-semibold text-slate-800">{rec.registryNo}</span>
                            <span>·</span>
                            <span className="font-medium text-slate-700">
                              {rec.type === 'incoming' ? `From: ${rec.source}` : `To: ${rec.target}`}
                            </span>
                          </div>

                          <h5 className="text-sm font-semibold text-slate-900 mb-1">
                            {rec.title}
                          </h5>

                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                            <span>
                              {rec.type === 'incoming' ? 'Received Date: ' : 'Outgoing Date: '}
                              <strong className="font-mono text-slate-700">{rec.recordDate}</strong>
                            </span>
                            <span>·</span>
                            <span>
                              Date on letter: <strong className="font-mono text-slate-700">{rec.dateOnCorrespondence}</strong>
                            </span>
                            {rec.folioNumber && (
                              <>
                                <span>·</span>
                                <span className="font-mono">Folio: {rec.folioNumber}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Item Quick Actions */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {rec.documents.length > 0 && (
                          <button
                            onClick={() => onOpenDocViewer(rec)}
                            className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Docs ({rec.documents.length})</span>
                          </button>
                        )}
                        <button
                          onClick={() => onOpenRoutingSlip(rec)}
                          className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
                          title="Print Routing Slip"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onEditRecord(rec)}
                          className="text-xs text-slate-600 hover:text-slate-900 px-2 py-1 rounded hover:bg-slate-100 transition-colors"
                        >
                          Edit
                        </button>
                      </div>
                    </div>

                    {/* Attached Documents Thumbnails if present */}
                    {rec.documents.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-2">
                        {rec.documents.map((doc) => (
                          <button
                            key={doc.id}
                            onClick={() => onOpenDocViewer(rec)}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs transition-colors"
                          >
                            <FileText className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span className="truncate max-w-[200px] font-medium">{doc.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              ({formatFileSize(doc.size)})
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
