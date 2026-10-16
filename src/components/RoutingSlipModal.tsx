import React, { useState, useEffect } from 'react';
import { Correspondence, CmsSettings } from '../types';
import { X, Printer, QrCode } from 'lucide-react';
import { getRegistrySettings, getCmsSettings } from '../utils/storage';
import { getCorrespondencePreviewUrl, generateQRCodeDataUrl } from '../utils/qrcode';

interface RoutingSlipModalProps {
  isOpen: boolean;
  onClose: () => void;
  correspondence: Correspondence | null;
  cmsSettings?: CmsSettings;
}

export const RoutingSlipModal: React.FC<RoutingSlipModalProps> = ({
  isOpen,
  onClose,
  correspondence,
  cmsSettings,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    if (correspondence && isOpen) {
      const url = getCorrespondencePreviewUrl(correspondence.id);
      generateQRCodeDataUrl(url, { width: 140, margin: 1 }).then(setQrDataUrl);
    }
  }, [correspondence, isOpen]);

  if (!isOpen || !correspondence) return null;

  const currentCms = cmsSettings || getCmsSettings();
  const settings = getRegistrySettings();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden my-6"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Top Actions (hidden during print) */}
        <div className="no-print flex items-center justify-between px-6 py-3.5 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-700">Official {currentCms.mdaName || 'Edo State MOCDE'} Registry Routing Slip</span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded flex items-center gap-1">
              <QrCode className="w-3 h-3" />
              <span>QR Verified</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Routing Slip</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Official Docket Document */}
        <div className="p-8 font-serif bg-white text-slate-900">
          {/* Edo State Header with Embedded Scannable QR Code and CMS Logo */}
          <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4 mb-5 gap-4">
            <div className="flex items-start gap-3.5 flex-1 text-left">
              {currentCms.logoUrl && (
                <img 
                  src={currentCms.logoUrl} 
                  alt="Ministry Logo" 
                  className="w-14 h-14 object-contain shrink-0 mt-0.5" 
                />
              )}
              <div className="flex-1">
                <p className="text-xs font-bold uppercase tracking-widest text-emerald-800 font-sans">
                  {currentCms.stateName || 'EDO STATE GOVERNMENT OF NIGERIA'}
                </p>
                <h1 className="text-base sm:text-lg font-bold tracking-tight uppercase font-sans text-slate-950 mt-0.5">
                  {currentCms.mdaName || 'MINISTRY OF COMMUNICATION AND DIGITAL ECONOMY'}
                </h1>
                <p className="text-[11px] font-sans tracking-wide text-slate-600">
                  {currentCms.department || settings.department} · {currentCms.address || settings.address}
                </p>
                <div className="inline-block mt-2 px-3 py-0.5 border border-slate-900 text-[11px] font-sans font-bold uppercase tracking-wider bg-slate-50">
                  {correspondence.type === 'incoming' 
                    ? 'INWARD CORRESPONDENCE & MINUTING ROUTING SLIP' 
                    : 'OUTWARD DISPATCH & FILING TRANSMITTAL SLIP'}
                </div>
              </div>
            </div>

            {/* Scannable QR Code on physical printed docket slip */}
            {qrDataUrl && (
              <div className="text-center shrink-0 border border-slate-300 p-1.5 rounded bg-white shadow-2xs">
                <img 
                  src={qrDataUrl} 
                  alt={`QR Code for ${correspondence.registryNo}`} 
                  className="w-20 h-20 mx-auto" 
                />
                <span className="block text-[8px] font-mono text-slate-700 font-bold uppercase mt-1">
                  Scan for E-Folio
                </span>
              </div>
            )}
          </div>

          {/* Core Table */}
          <table className="w-full text-xs border-collapse border border-slate-400 mb-5 font-sans">
            <tbody>
              <tr>
                <td className="border border-slate-300 p-2 font-bold bg-slate-50 w-1/3">Registry Reference No:</td>
                <td className="border border-slate-300 p-2 font-mono font-bold text-sm text-slate-950">{correspondence.registryNo}</td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-2 font-bold bg-slate-50">Ministry File Jacket No:</td>
                <td className="border border-slate-300 p-2 font-mono font-bold text-sm text-emerald-900">{correspondence.fileNumber}</td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-2 font-bold bg-slate-50">
                  {correspondence.type === 'incoming' ? 'Date Received in Registry:' : 'Date Dispatched from Registry:'}
                </td>
                <td className="border border-slate-300 p-2 font-mono font-semibold">{correspondence.recordDate}</td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-2 font-bold bg-slate-50">Date on Physical Letter:</td>
                <td className="border border-slate-300 p-2 font-mono">{correspondence.dateOnCorrespondence}</td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-2 font-bold bg-slate-50">
                  {correspondence.type === 'incoming' ? 'Source (Sender / Originating Body):' : 'Target (Addressee / Recipient):'}
                </td>
                <td className="border border-slate-300 p-2 font-semibold text-slate-900">
                  {correspondence.type === 'incoming'
                    ? (correspondence.source || 'N/A')
                    : (correspondence.target || 'N/A')}
                  {correspondence.type === 'incoming' && (correspondence as any).recipient && (
                    <div className="text-[11px] font-normal text-slate-600 mt-0.5">
                      Routed to: <span className="font-semibold">{(correspondence as any).recipient}</span>
                    </div>
                  )}
                </td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-2 font-bold bg-slate-50">Subject / Matter:</td>
                <td className="border border-slate-300 p-2 font-medium leading-relaxed">{correspondence.title}</td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-2 font-bold bg-slate-50">Physical Shelf / Cabinet Location:</td>
                <td className="border border-slate-300 p-2">{correspondence.physicalLocation || 'Central Registry Room, Block C'}</td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-2 font-bold bg-slate-50">Folio Number in Jacket:</td>
                <td className="border border-slate-300 p-2 font-mono font-semibold">{correspondence.folioNumber || 'Unassigned'}</td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-2 font-bold bg-slate-50">Attached Enclosures ({correspondence.documents.length}):</td>
                <td className="border border-slate-300 p-2">
                  {correspondence.documents.length === 0 ? (
                    'No digital attachments uploaded'
                  ) : (
                    <ul className="list-disc list-inside space-y-0.5">
                      {correspondence.documents.map((d, i) => (
                        <li key={i} className="font-mono text-[11px]">{d.name}</li>
                      ))}
                    </ul>
                  )}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Minuting Directives */}
          <div className="border border-slate-400 p-4 mb-5">
            <h3 className="text-xs font-bold uppercase font-sans mb-1 text-slate-900">
              Permanent Secretary / Commissioner Minuting & Directives
            </h3>
            <p className="text-xs italic text-slate-800 min-h-[50px] leading-relaxed">
              {correspondence.remarks || 'To: _____________________________________ For your urgent action, review, and feedback to the Hon. Commissioner.'}
            </p>
          </div>

          {/* Signature Grid */}
          <div className="grid grid-cols-2 gap-8 text-xs font-sans pt-3 border-t border-slate-300">
            <div>
              <p className="font-bold">MOCDE Registry Receiving Officer:</p>
              <div className="h-9 border-b border-dashed border-slate-400 mt-2"></div>
              <p className="text-[10px] text-slate-500 mt-1">Signature, Name & Date Stamp</p>
            </div>
            <div>
              <p className="font-bold">Action Officer / Director:</p>
              <div className="h-9 border-b border-dashed border-slate-400 mt-2"></div>
              <p className="text-[10px] text-slate-500 mt-1">Signature, Directorate & Date</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
