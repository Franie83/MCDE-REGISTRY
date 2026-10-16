import React, { useState, useEffect } from 'react';
import { Correspondence } from '../types';
import { getCorrespondencePreviewUrl, generateQRCodeDataUrl } from '../utils/qrcode';
import { 
  X, 
  QrCode, 
  Copy, 
  Check, 
  ExternalLink, 
  Printer, 
  Smartphone, 
  Eye, 
  ShieldCheck 
} from 'lucide-react';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  correspondence: Correspondence | null;
  onOpenPreview: (record: Correspondence) => void;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({
  isOpen,
  onClose,
  correspondence,
  onOpenPreview,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  useEffect(() => {
    if (correspondence && isOpen) {
      const url = getCorrespondencePreviewUrl(correspondence.id);
      setPreviewUrl(url);
      generateQRCodeDataUrl(url, { width: 320 }).then(dataUrl => {
        setQrDataUrl(dataUrl);
      });
    } else {
      setQrDataUrl('');
      setPreviewUrl('');
    }
    setCopied(false);
  }, [correspondence, isOpen]);

  if (!isOpen || !correspondence) return null;

  const handleCopyLink = () => {
    if (!previewUrl) return;
    navigator.clipboard.writeText(previewUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrintBadge = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.print();
      return;
    }
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Registry Badge - ${correspondence.registryNo}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 24px; text-align: center; }
            .badge { border: 2px solid #0f172a; padding: 20px; max-width: 380px; margin: 0 auto; border-radius: 12px; }
            .qr-img { width: 220px; height: 220px; margin: 10px auto; }
            h2 { font-size: 14px; text-transform: uppercase; margin: 0 0 4px; color: #047857; }
            h3 { font-size: 16px; margin: 4px 0 12px; }
            p { font-size: 12px; color: #475569; margin: 4px 0; font-family: monospace; }
            .instr { font-size: 11px; color: #64748b; margin-top: 12px; font-style: italic; }
          </style>
        </head>
        <body>
          <div class="badge">
            <h2>Edo State Government of Nigeria</h2>
            <h3>Ministry of Communication & Digital Economy</h3>
            <img src="${qrDataUrl}" class="qr-img" alt="QR Code" />
            <p><strong>Ref:</strong> ${correspondence.registryNo}</p>
            <p><strong>File No:</strong> ${correspondence.fileNumber}</p>
            <p><strong>Date:</strong> ${correspondence.recordDate}</p>
            <p class="instr">Scan with phone camera to preview digital document and attached folios instantly.</p>
          </div>
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden animate-fade-in"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Document QR Code</h2>
              <p className="text-[11px] text-slate-500 font-mono">
                {correspondence.registryNo}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 text-center space-y-4 text-xs">
          {/* QR Code Canvas */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs inline-block mx-auto relative group">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={`QR code for ${correspondence.registryNo}`}
                className="w-56 h-56 mx-auto object-contain"
              />
            ) : (
              <div className="w-56 h-56 flex items-center justify-center text-slate-400">
                <span>Generating QR code...</span>
              </div>
            )}
            
            <div className="mt-2 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-emerald-800">
              <Smartphone className="w-3.5 h-3.5" />
              <span>Scan with mobile camera to view document</span>
            </div>
          </div>

          {/* Record Details card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-left space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Correspondence Reference
              </span>
              <span className="font-mono font-bold text-slate-900 text-[11px]">
                {correspondence.registryNo}
              </span>
            </div>

            <p className="font-semibold text-slate-900 line-clamp-2 leading-relaxed">
              {correspondence.title}
            </p>

            <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono pt-1 border-t border-slate-200">
              <span>File: <strong className="text-emerald-900">{correspondence.fileNumber}</strong></span>
              <span>Date: <strong>{correspondence.recordDate}</strong></span>
            </div>
          </div>

          {/* Direct Link Copy Box */}
          <div className="space-y-1.5 text-left">
            <label className="text-[11px] font-medium text-slate-600 block">
              Direct Preview URL:
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                readOnly
                value={previewUrl}
                className="w-full text-[11px] px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-600 font-mono select-all truncate"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 shrink-0 ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-900 text-white hover:bg-slate-800'
                }`}
                title="Copy direct link"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-slate-200">
            <button
              type="button"
              onClick={handlePrintBadge}
              className="w-full sm:w-auto px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print QR Label Sticker</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenPreview(correspondence);
              }}
              className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Open Preview Now</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
