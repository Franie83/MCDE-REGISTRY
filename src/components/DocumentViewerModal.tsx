import React, { useState } from 'react';
import { AttachedDocument, Correspondence, FolderFile, CmsSettings } from '../types';
import { formatFileSize, getCmsSettings } from '../utils/storage';
import { 
  X, 
  Download, 
  FileText, 
  Printer, 
  Search, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Maximize2, 
  Minimize2, 
  Building2, 
  CheckCircle2, 
  Clock, 
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  QrCode
} from 'lucide-react';

interface DocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  correspondence?: Correspondence | null;
  standaloneFile?: FolderFile | null;
  onOpenQrCode?: (record: Correspondence) => void;
  cmsSettings?: CmsSettings;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  isOpen,
  onClose,
  correspondence,
  standaloneFile,
  onOpenQrCode,
  cmsSettings,
}) => {
  // PDF_URL_RESOLVER: pick the best URL for previews. Cloudinary-uploaded docs
  // don't have dataUrl; they have cloudinaryUrl.
  const resolveDocUrl = (doc?: AttachedDocument | null): string | null => {
    if (!doc) return null;
    const anyDoc = doc as any;
    if (anyDoc.cloudinaryUrl) return anyDoc.cloudinaryUrl;
    if (doc.dataUrl) return doc.dataUrl;
    return null;
  };

  const [selectedDocIndex, setSelectedDocIndex] = useState<number>(0);
  const [activeViewMode, setActiveViewMode] = useState<'letterhead' | 'attachment'>('letterhead');
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [rotation, setRotation] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');

  if (!isOpen) return null;
  if (!correspondence && !standaloneFile) return null;

  // Normalize document list
  const docs: AttachedDocument[] = correspondence?.documents || (standaloneFile ? [standaloneFile] : []);
  const currentDoc: AttachedDocument | undefined = docs[selectedDocIndex] || docs[0];

  const handleDownload = (doc?: AttachedDocument) => {
    if (!doc) return;
    // DOWNLOAD_BY_URL: if we have a Cloudinary URL, open it in a new tab so the
    // browser handles the actual file download.
    const anyDoc = doc as any;
    const remoteUrl = anyDoc.cloudinaryUrl || (doc.dataUrl && !doc.dataUrl.startsWith('data:') ? doc.dataUrl : null);
    if (remoteUrl) {
      window.open(remoteUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    if (doc.dataUrl) {
      const a = document.createElement('a');
      a.href = doc.dataUrl;
      a.download = doc.name;
      a.click();
      return;
    }
    const content = doc.previewContent || `Edo State MOCDE Document: ${doc.name}\nReference: ${correspondence?.registryNo || 'Archive'}`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = doc.name.endsWith('.txt') ? doc.name : `${doc.name}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  const isImage = (doc?: AttachedDocument) => {
    if (!doc) return false;
    return doc.type.startsWith('image/') || /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(doc.name);
  };

  const isPdf = (doc?: AttachedDocument) => {
    if (!doc) return false;
    return doc.type === 'application/pdf' || /\.pdf$/i.test(doc.name);
  };

  const isOfficeDoc = (doc?: AttachedDocument) => {
    if (!doc) return false;
    return /\.(docx?|xlsx?|pptx?)$/i.test(doc.name);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-fade-in">
      <div 
        className={`bg-white rounded-2xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden transition-all duration-200 ${
          isFullscreen ? 'w-full h-full rounded-none' : 'max-w-6xl w-full h-[90vh]'
        }`}
        role="dialog"
        aria-modal="true"
      >
        {/* Top Control Bar */}
        <div className="no-print flex items-center justify-between px-5 py-3 border-b border-slate-200 bg-slate-50 shrink-0 gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                <span className="font-bold text-slate-800 truncate">
                  {correspondence ? correspondence.registryNo : standaloneFile?.name}
                </span>
                {correspondence && (
                  <>
                    <span>·</span>
                    <span className="text-emerald-900 font-semibold">{correspondence.fileNumber}</span>
                  </>
                )}
                <span>·</span>
                <span className="text-slate-500 font-sans">In-Browser Preview</span>
              </div>
              <h2 className="text-sm font-semibold text-slate-900 truncate">
                {correspondence ? correspondence.title : standaloneFile?.notes || 'Archived Document File'}
              </h2>
            </div>
          </div>

          {/* View mode toggle (Letterhead vs Attachments) if correspondence exists */}
          <div className="flex items-center gap-2 shrink-0">
            {correspondence && (
              <div className="flex items-center gap-1 p-0.5 bg-slate-200/70 rounded-lg text-xs font-medium">
                <button
                  onClick={() => setActiveViewMode('letterhead')}
                  className={`px-3 py-1.5 rounded-md transition-colors ${
                    activeViewMode === 'letterhead'
                      ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Official Letter
                </button>
                <button
                  onClick={() => {
                    setActiveViewMode('attachment');
                    if (docs.length > 0 && selectedDocIndex === -1) setSelectedDocIndex(0);
                  }}
                  className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
                    activeViewMode === 'attachment'
                      ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>Attached Enclosures</span>
                  <span className="font-mono text-[11px] bg-slate-100 text-slate-700 px-1.5 rounded-sm">
                    {docs.length}
                  </span>
                </button>
              </div>
            )}

            {/* Quick Action Tools */}
            <div className="flex items-center gap-1 border-l border-slate-200 pl-2">
              <button
                onClick={() => setZoomLevel(prev => Math.min(prev + 15, 180))}
                className="p-1.5 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-200/60 transition-colors"
                title="Zoom in"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => setZoomLevel(prev => Math.max(prev - 15, 60))}
                className="p-1.5 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-200/60 transition-colors"
                title="Zoom out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={() => setRotation(r => (r + 90) % 360)}
                className="p-1.5 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-200/60 transition-colors"
                title="Rotate 90 degrees"
              >
                <RotateCw className="w-4 h-4" />
              </button>
              {correspondence && onOpenQrCode && (
                <button
                  onClick={() => onOpenQrCode(correspondence)}
                  className="p-1.5 text-slate-600 hover:text-emerald-900 rounded-lg hover:bg-slate-200/60 transition-colors"
                  title="Generate & Scan QR Code"
                >
                  <QrCode className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={handlePrint}
                className="p-1.5 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-200/60 transition-colors"
                title="Print Document directly"
              >
                <Printer className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDownload(currentDoc)}
                className="p-1.5 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-200/60 transition-colors"
                title="Download local copy (optional)"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-1.5 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-200/60 transition-colors"
                title={isFullscreen ? 'Exit full screen' : 'Full screen reader'}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors ml-1"
                title="Close Viewer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Main Body: Document Viewer Canvas */}
        <div className="flex-1 flex overflow-hidden bg-slate-200/60">
          {/* Document list sidebar when in attachment mode */}
          {activeViewMode === 'attachment' && docs.length > 1 && (
            <div className="no-print w-64 border-r border-slate-200 bg-white p-3 overflow-y-auto shrink-0 flex flex-col justify-between">
              <div>
                <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">
                  Enclosure Documents ({docs.length})
                </span>
                <div className="space-y-1">
                  {docs.map((doc, idx) => (
                    <button
                      key={doc.id || idx}
                      onClick={() => setSelectedDocIndex(idx)}
                      className={`w-full text-left p-2.5 rounded-lg text-xs transition-colors flex items-start gap-2.5 ${
                        selectedDocIndex === idx
                          ? 'bg-slate-900 text-white shadow-2xs'
                          : 'hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <FileText className={`w-4 h-4 shrink-0 mt-0.5 ${selectedDocIndex === idx ? 'text-slate-200' : 'text-slate-400'}`} />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{doc.name}</p>
                        <p className={`text-[10px] font-mono mt-0.5 ${selectedDocIndex === idx ? 'text-slate-300' : 'text-slate-400'}`}>
                          {formatFileSize(doc.size)}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-2 border-t border-slate-200 text-[11px] text-slate-500">
                <span className="block font-semibold text-slate-700 mb-0.5">Instant Previews:</span>
                <p>All letters, PDFs, and enclosures render live without saving to local disk.</p>
              </div>
            </div>
          )}

          {/* Central Viewer Stage */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex items-start justify-center">
            {/* View Mode 1: OFFICIAL LETTERHEAD READER */}
            {activeViewMode === 'letterhead' && correspondence && (
              <div 
                style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
                className="bg-white rounded-lg shadow-md border border-slate-300 p-8 sm:p-12 max-w-3xl w-full text-slate-900 font-serif min-h-[750px] relative transition-transform duration-150"
              >
                {/* Official Crest Letterhead from CMS */}
                {(() => {
                  const currentCms = cmsSettings || getCmsSettings();
                  return (
                    <div className="text-center border-b-2 border-slate-900 pb-5 mb-8 font-sans">
                      {currentCms.logoUrl ? (
                        <img 
                          src={currentCms.logoUrl} 
                          alt="Ministry Emblem" 
                          className="w-14 h-14 rounded-full object-contain mx-auto mb-2 border border-slate-200 bg-white shadow-2xs" 
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full border-2 border-emerald-800 mx-auto mb-2 flex items-center justify-center bg-emerald-50 text-emerald-900 font-bold text-xs tracking-tighter shadow-2xs">
                          EDSG
                        </div>
                      )}
                      <h1 className="text-xs font-bold uppercase tracking-widest text-emerald-900">
                        {currentCms.stateName || 'Edo State Government of Nigeria'}
                      </h1>
                      <h2 className="text-lg font-bold tracking-tight uppercase text-slate-950 mt-0.5">
                        {currentCms.mdaName || 'Ministry of Communication and Digital Economy'}
                      </h2>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {currentCms.department} · {currentCms.address}
                      </p>
                      <div className="flex items-center justify-between text-xs text-slate-500 font-mono pt-3 mt-3 border-t border-slate-200">
                        <span>Ref: <strong>{correspondence.registryNo}</strong></span>
                        <span>Document No: <strong className="text-emerald-900">{correspondence.fileNumber}</strong></span>
                        <span>Date: <strong>{correspondence.dateOnCorrespondence}</strong></span>
                      </div>
                    </div>
                  );
                })()}

                {/* Sender / Addressee Header */}
                <div className="font-sans text-xs mb-6 space-y-1">
                  {correspondence.type === 'incoming' ? (
                    <>
                      <p className="text-slate-500 font-medium uppercase tracking-wider text-[10px]">From Originating Authority:</p>
                      <p className="font-bold text-sm text-slate-900">{correspondence.source}</p>
                      <p className="text-slate-600">
                        To: {(correspondence as any).recipient || 'The Honourable Commissioner / Permanent Secretary'}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-slate-500 font-medium uppercase tracking-wider text-[10px]">Dispatched To:</p>
                      <p className="font-bold text-sm text-slate-900">{correspondence.target}</p>
                      <p className="text-slate-600">From: Ministry of Communication & Digital Economy, Benin City</p>
                    </>
                  )}
                </div>

                {/* Letter Subject */}
                <div className="font-sans mb-6">
                  <p className="text-xs uppercase font-bold text-slate-500 tracking-wider">Subject:</p>
                  <h3 className="text-base font-bold text-slate-950 uppercase underline decoration-2 underline-offset-4 mt-1 leading-snug">
                    {correspondence.title}
                  </h3>
                </div>

                {/* Official Letter Body Text */}
                <div className="text-sm leading-relaxed space-y-4 mb-8 text-slate-800 text-justify font-serif">
                  {correspondence.letterBody ? (
                    correspondence.letterBody.split('\n\n').map((paragraph, idx) => (
                      <p key={idx} className="indent-6">{paragraph}</p>
                    ))
                  ) : (
                    <>
                      <p className="indent-6">
                        I am directed to respectfully forward herewith official correspondence concerning <strong>{correspondence.title}</strong> for your administrative consideration and necessary action.
                      </p>
                      <p className="indent-6">
                        The accompanying schedules and technical annexes attached hereto have been verified by the Central Registry in compliance with the Edo State Public Records & Electronic Governance directives.
                      </p>
                      <p className="indent-6">
                        Kindly review the stipulations contained herein and issue the appropriate departmental directives at your earliest convenience.
                      </p>
                    </>
                  )}
                </div>

                {/* Signatory block */}
                <div className="font-sans text-xs pt-4 mb-8 max-w-xs">
                  <div className="h-10 border-b border-slate-400 mb-2"></div>
                  <p className="font-bold text-slate-900">
                    {correspondence.signatory
                      || (cmsSettings && (cmsSettings as any).activeOfficerName)
                      || 'Registry Officer'}
                  </p>
                  <p className="text-slate-500 text-[11px]">
                    {(cmsSettings && (cmsSettings as any).activeOfficerRole) || 'Authorized Signatory'}
                  </p>
                </div>

                {/* Official Physical Stamp / Registry Folio Endorsement */}
                <div className="border-2 border-emerald-700 text-emerald-800 rounded-lg p-3 font-mono text-xs max-w-xs ml-auto rotate-[-2deg] bg-emerald-50/40 relative">
                  {(cmsSettings && (cmsSettings as any).logoUrl) && (
                    <img
                      src={(cmsSettings as any).logoUrl}
                      alt="Registry Stamp"
                      className="w-12 h-12 object-contain absolute -top-6 -right-2 opacity-90"
                    />
                  )}
                  <div className="flex items-center gap-1.5 font-bold uppercase text-[11px] mb-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>EDSG MOCDE REGISTRY STAMP</span>
                  </div>
                  <p>Received / Dispatched: <strong>{correspondence.recordDate}</strong></p>
                  <p>Docket: <strong>{correspondence.fileNumber}</strong></p>
                  {correspondence.folioNumber && <p>Folio: <strong>{correspondence.folioNumber}</strong></p>}
                  <p>Status: <strong className="uppercase">{correspondence.status}</strong></p>
                </div>

                {/* Attached Enclosures Footnote */}
                {correspondence.documents.length > 0 && (
                  <div className="mt-8 pt-4 border-t border-slate-200 text-xs text-slate-500 font-sans flex items-center justify-between">
                    <span>
                      Enclosures ({correspondence.documents.length}): {correspondence.documents.map(d => d.name).join(', ')}
                    </span>
                    <button
                      onClick={() => setActiveViewMode('attachment')}
                      className="text-emerald-800 hover:text-emerald-950 font-semibold underline"
                    >
                      View attached documents &rarr;
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* View Mode 2: ATTACHED ENCLOSURE FILE PREVIEW */}
            {(activeViewMode === 'attachment' || !correspondence) && (
              <div 
                style={{ 
                  transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg)`, 
                  transformOrigin: 'top center' 
                }}
                className="bg-white rounded-lg shadow-md border border-slate-300 p-6 sm:p-10 max-w-4xl w-full min-h-[700px] transition-transform duration-150"
              >
                {!currentDoc ? (
                  <div className="text-center py-24 text-slate-400">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p className="text-sm font-semibold text-slate-700">No document attached to this entry</p>
                  </div>
                ) : isImage(currentDoc) && resolveDocUrl(currentDoc) ? (
                  /* High-Res Image View */
                  <div className="flex flex-col items-center">
                    <div className="mb-4 text-xs text-slate-500 font-mono flex items-center justify-between w-full border-b pb-2">
                      <span className="font-semibold text-slate-800">{currentDoc.name}</span>
                      <span>{formatFileSize(currentDoc.size)} · Image Attachment</span>
                    </div>
                    <img 
                      src={resolveDocUrl(currentDoc) || undefined} 
                      alt={currentDoc.name} 
                      className="max-h-[75vh] object-contain rounded border border-slate-200 shadow-xs"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                ) : isPdf(currentDoc) && resolveDocUrl(currentDoc) ? (   /* PDF_BY_URL */
                  /* Embedded PDF Object View */
                  <div className="w-full h-[75vh]">
                    <div className="mb-3 text-xs text-slate-500 font-mono flex items-center justify-between border-b pb-2">
                      <span className="font-semibold text-slate-800">{currentDoc.name}</span>
                      <span>{formatFileSize(currentDoc.size)} · PDF Document</span>
                    </div>
                    <iframe 
                      src={resolveDocUrl(currentDoc) || undefined} 
                      title={currentDoc.name}
                      className="w-full h-full border border-slate-300 rounded-lg bg-slate-100"
                    />
                  </div>
                ) : (
                  /* Formatted Document Reader for Text, Memos, PDFs and Office Specs */
                  <div className="space-y-6">
                    {/* Header */}
                    <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 font-mono mb-1">
                          <span className="bg-emerald-50 text-emerald-800 font-semibold px-2 py-0.5 rounded text-[11px]">
                            {currentDoc.type || 'Official Enclosure'}
                          </span>
                          <span>·</span>
                          <span>{formatFileSize(currentDoc.size)}</span>
                          <span>·</span>
                          <span>Verified Archival Copy</span>
                        </div>
                        <h3 className="text-base font-bold text-slate-900 font-sans">
                          {currentDoc.name}
                        </h3>
                      </div>

                      <button
                        onClick={() => handleDownload(currentDoc)}
                        className="self-start sm:self-center px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Copy</span>
                      </button>
                    </div>

                    {/* Rich preview text rendering */}
                    <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-6 font-mono text-xs leading-relaxed text-slate-800 whitespace-pre-wrap max-h-[550px] overflow-y-auto">
                      {currentDoc.previewContent || `DOCUMENT PREVIEW: ${currentDoc.name}

Reference: ${correspondence?.registryNo || 'Direct File File'}
Filing Docket: ${correspondence?.fileNumber || 'Central Archive'}
Date Uploaded: ${new Date(currentDoc.uploadedAt).toLocaleString()}
Document Type: ${currentDoc.type}

Document Summary:
This official document has been securely archived in the Edo State Ministry of Communication and Digital Economy Document Registry. It contains verified technical specifications, correspondence annexes, or scanned administrative folios.

All contents are indexed and searchable across the Ministry registry.`}
                    </div>

                    <div className="p-3 bg-white border border-slate-200 rounded-lg flex items-center justify-between text-xs text-slate-500 font-sans">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Live Document Stream Verified — No download required to read.</span>
                      </div>
                      <span className="font-mono text-[11px]">Edo State MOCDE EDMS</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modal Bottom Status Bar */}
        <div className="no-print px-5 py-2.5 border-t border-slate-200 bg-white flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div className="flex items-center gap-3">
            <span>Zoom: <strong className="font-mono text-slate-700">{zoomLevel}%</strong></span>
            {rotation > 0 && <span>Rotation: <strong className="font-mono text-slate-700">{rotation}°</strong></span>}
            <span>Mode: <strong className="capitalize text-slate-700">{activeViewMode}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <span>Press <kbd className="px-1.5 py-0.5 text-[10px] bg-slate-100 border border-slate-300 rounded font-mono">Esc</kbd> to close</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// RECIPIENT_ON_LETTERHEAD

// LETTERHEAD_CMS_AWARE
