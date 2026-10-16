/**
 * storage.ts - pure helpers for the MOCDE Registry.
 *
 * After the backend migration, this file no longer touches localStorage.
 * It keeps:
 *   - File/CSV formatting helpers
 *   - Registry number generation
 *   - File -> AttachedDocument conversion (for preview text)
 *   - Default CMS settings and the Edo State seal SVG
 *
 * Components that used to call `getStoredCorrespondence()`, `saveStoredFolders()`,
 * etc. now import the async equivalents from `api.ts` instead.
 */
import type {
  ArchiveFolder,
  AttachedDocument,
  AuditLogEntry,
  Correspondence,
  CmsSettings,
} from '../types';

// ?? Registry settings (mirrors backend CMS defaults) ????????????????????
export interface RegistrySettings {
  stateName: string;
  mdaName: string;
  department: string;
  address: string;
  inwardPrefix: string;
  outwardPrefix: string;
  currentYear: string;
}

export const defaultSettings: RegistrySettings = {
  stateName: 'Edo State Government of Nigeria',
  mdaName: 'Ministry of Communication and Digital Economy',
  department: 'Central Registry & Archival Records Unit',
  address: 'Block C, Edo State Secretariat Complex, Sapele Road, Benin City, Edo State',
  inwardPrefix: 'EDSG/MOCDE/INW',
  outwardPrefix: 'EDSG/MOCDE/OUT',
  currentYear: '2026',
};

// Kept as a stub for components that still reference it (returns defaults).
export function getRegistrySettings(): RegistrySettings {
  return defaultSettings;
}

// ?? File size formatting ????????????????????????????????????????????????
export function formatFileSize(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = parseFloat((bytes / Math.pow(k, i)).toFixed(1));
  return value + ' ' + sizes[i];
}

// ?? Registry number generation ??????????????????????????????????????????
export function generateNextRegistryNumber(
  type: 'incoming' | 'outgoing',
  existingRecords: Correspondence[]
): string {
  const year = new Date().getFullYear().toString();
  const prefix = type === 'incoming'
    ? defaultSettings.inwardPrefix
    : defaultSettings.outwardPrefix;

  let maxSerial = 0;
  for (const item of existingRecords) {
    if (item.type === type && item.registryNo) {
      const escaped = prefix.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
      const match = item.registryNo.match(
        new RegExp(escaped + '/' + year + '/(\\d+)')
      );
      if (match && match[1]) {
        const serial = parseInt(match[1], 10);
        if (!isNaN(serial) && serial > maxSerial) maxSerial = serial;
      }
    }
  }
  const nextSerial = (maxSerial + 1).toString().padStart(4, '0');
  return prefix + '/' + year + '/' + nextSerial;
}

// ?? File -> AttachedDocument (preview text extraction) ?????????????????
/**
 * Reads a File and produces an AttachedDocument shape with:
 *   - the raw File object attached as `file` (for Cloudinary upload)
 *   - `previewContent` for text-like files (shown in the in-browser viewer)
 *
 * The actual upload to Cloudinary is done separately via api.upload().
 */
export interface PendingDocument extends AttachedDocument {
  file: File;
}

export function processUploadedFile(file: File): Promise<PendingDocument> {
  return new Promise((resolve) => {
    const baseDoc: PendingDocument = {
      id: 'doc-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6),
      name: file.name,
      size: file.size,
      type: file.type || 'application/octet-stream',
      uploadedAt: new Date().toISOString(),
      file,
      dataUrl: undefined,
      previewContent: undefined,
    };

    const isTextLike =
      file.type.startsWith('text/') ||
      /\.(txt|csv|json|md|log)$/i.test(file.name);

    if (!isTextLike) {
      baseDoc.previewContent =
        'File: ' + file.name + '\n' +
        'Size: ' + formatFileSize(file.size) + '\n' +
        'Type: ' + (file.type || 'Document') + '\n' +
        'Uploaded: ' + new Date().toLocaleDateString();
      resolve(baseDoc);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      baseDoc.previewContent = String(reader.result || '').slice(0, 5000);
      resolve(baseDoc);
    };
    reader.onerror = () => {
      baseDoc.previewContent = 'File: ' + file.name + ' (preview unavailable)';
      resolve(baseDoc);
    };
    reader.readAsText(file);
  });
}

// ?? CSV exports ?????????????????????????????????????????????????????????
function escapeCSV(value: string | number | undefined | null): string {
  if (value === undefined || value === null) return '""';
  const s = String(value).replace(/"/g, '""');
  return '"' + s + '"';
}

export function exportToCSV(records: Correspondence[]): void {
  const headers = [
    'Registry Number', 'Type', 'Record Date', 'Date on Letter',
    'File Number', 'Title / Subject', 'Source (Sender)', 'Target (Recipient)',
    'Category', 'Priority', 'Status', 'Action Officer',
    'Physical Location', 'Folio Reference', 'Document Count',
    'Document Names', 'Remarks',
  ];

  const rows = records.map((r) => [
    escapeCSV(r.registryNo),
    escapeCSV(r.type.toUpperCase()),
    escapeCSV(r.recordDate),
    escapeCSV(r.dateOnCorrespondence),
    escapeCSV(r.fileNumber),
    escapeCSV(r.title),
    escapeCSV(r.source || 'N/A'),
    escapeCSV(r.target || 'N/A'),
    escapeCSV(r.category || 'General'),
    escapeCSV(r.priority.toUpperCase()),
    escapeCSV(r.status.toUpperCase()),
    escapeCSV(r.actionOfficer || 'Unassigned'),
    escapeCSV(r.physicalLocation || 'Central Archive'),
    escapeCSV(r.folioNumber || 'N/A'),
    escapeCSV(r.documents.length),
    escapeCSV(r.documents.map((d) => d.name).join('; ')),
    escapeCSV(r.remarks || ''),
  ].join(','));

  const csv = [headers.join(','), ...rows].join('\n');
  downloadBlob(csv, 'Edo_MOCDE_Registry_Ledger_' + isoToday() + '.csv');
}

export function exportAuditLogsToCSV(logs: AuditLogEntry[]): void {
  const headers = [
    'Log ID', 'Timestamp (UTC)', 'Action Taken', 'Officer Responsible',
    'Officer Role', 'Entity Type', 'Entity Reference',
    'Title / Subject', 'Action Details', 'Workstation / IP',
  ];

  const rows = logs.map((l) => [
    escapeCSV(l.id),
    escapeCSV(l.timestamp),
    escapeCSV(l.action),
    escapeCSV(l.actor),
    escapeCSV(l.actorRole),
    escapeCSV(l.entityType.toUpperCase()),
    escapeCSV(l.entityRef),
    escapeCSV(l.title),
    escapeCSV(l.details),
    escapeCSV(l.workstation),
  ].join(','));

  const csv = [headers.join(','), ...rows].join('\n');
  downloadBlob(csv, 'Edo_MOCDE_Registry_Audit_Trail_' + isoToday() + '.csv');
}

function downloadBlob(text: string, filename: string): void {
  const blob = new Blob([text], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function isoToday(): string {
  return new Date().toISOString().split('T')[0];
}

// ?? Default Edo State seal (SVG data URI) ???????????????????????????????
export const defaultEdoStateLogo =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">' +
  '<circle cx="60" cy="60" r="56" fill="%23064e3b" stroke="%23f59e0b" stroke-width="4"/>' +
  '<circle cx="60" cy="60" r="48" fill="%23ffffff"/>' +
  '<path d="M60 22 L82 38 L82 72 L60 92 L38 72 L38 38 Z" fill="%23047857" stroke="%23b45309" stroke-width="2.5"/>' +
  '<circle cx="60" cy="56" r="16" fill="%23f59e0b"/>' +
  '<text x="60" y="61" font-family="Arial,sans-serif" font-size="12" font-weight="bold" fill="%23064e3b" text-anchor="middle">EDSG</text>' +
  '<path d="M26 88 Q60 106 94 88" fill="none" stroke="%23f59e0b" stroke-width="3.5"/></svg>';

// ?? Default CMS settings (fallback before API loads) ????????????????????
export const defaultCmsSettings: CmsSettings = {
  stateName: 'Edo State Government of Nigeria',
  mdaName: 'Ministry of Communication and Digital Economy',
  department: 'Central Registry & Archival Records Directorate',
  address: 'Block C, Edo State Secretariat Complex, Sapele Road, Benin City, Edo State',
  logoUrl: defaultEdoStateLogo,
  inwardPrefix: 'EDSG/MOCDE/INW',
  outwardPrefix: 'EDSG/MOCDE/OUT',
  currentYear: '2026',
  officialEmail: 'registry@mocde.edostate.gov.ng',
  officialPhone: '+234 800 336 6623',
  activeOfficerName: 'Osamwonyi E.',
  activeOfficerRole: 'Central Registry Supervisor',
  bannerNotice: 'Mandatory Compliance: All inter-departmental letters and memos must be recorded in the digital registry with assigned folder jackets.',
  directorates: [
    'ICT Infrastructure & Broadband',
    'Digital Economy & Innovation',
    'e-Governance & Software Solutions',
    'Administration & Supplies',
    'Finance & Accounts',
    'Public Service e-Gov',
  ],
};

// ?? Compatibility shims ????????????????????????????????????????????????
// These used to read/write localStorage. Now they are no-ops that
// simply return the fallback value, so any code path we missed during
// the migration still compiles. Real data comes from api.ts.
export function getCmsSettings(): CmsSettings {
  return defaultCmsSettings;
}

export function saveCmsSettings(_settings: CmsSettings): void {
  // no-op after migration
}

export function getStoredFolders(): ArchiveFolder[] {
  return [];
}

export function saveStoredFolders(_folders: ArchiveFolder[]): void {
  // no-op
}

export function getStoredCorrespondence(): Correspondence[] {
  return [];
}

export function saveCorrespondenceList(_records: Correspondence[]): void {
  // no-op
}

export function getStoredAuditLogs(): AuditLogEntry[] {
  return [];
}

export function saveStoredAuditLogs(_logs: AuditLogEntry[]): void {
  // no-op
}

export function logAuditEvent(_entry: {
  action: string;
  actor?: string;
  actorRole?: string;
  entityType: 'correspondence' | 'folder' | 'document' | 'cms';
  entityId: string;
  entityRef: string;
  title: string;
  details: string;
}): AuditLogEntry | null {
  // Audit is server-side now; this is a no-op kept for compile compatibility.
  return null;
}
