/**
 * App.tsx - MOCDE Registry application shell.
 *
 * Wrapped in <AuthProvider>. Renders <LoginView> when no user is logged in,
 * otherwise renders the full registry.
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  Correspondence, CorrespondenceType, ArchiveFolder, FolderFile,
  AuditLogEntry, CmsSettings,
} from './types';
import { AuthProvider, useAuth } from './context/AuthContext';
import api from './utils/api';
import { defaultCmsSettings } from './utils/storage';
import { can } from './utils/auth';

import { Header } from './components/Header';
import { StatsBar } from './components/StatsBar';
import { CorrespondenceTable } from './components/CorrespondenceTable';
import { CorrespondenceFormModal } from './components/CorrespondenceFormModal';
import { DocumentViewerModal } from './components/DocumentViewerModal';
import { RoutingSlipModal } from './components/RoutingSlipModal';
import { QRCodeModal } from './components/QRCodeModal';
import { FileDocketView } from './components/FileDocketView';
import { FolderManagerView } from './components/FolderManagerView';
import { AuditLogView } from './components/AuditLogView';
import { CmsSettingsView } from './components/CmsSettingsView';
import { FlaskBackendModal } from './components/FlaskBackendModal';
import { LoginView } from './components/LoginView';
import { UserManagerView } from './components/UserManagerView';
import { ChangePasswordModal } from './components/ChangePasswordModal';
import { AdminView } from './components/AdminView';
import { DatabaseAdminView } from './components/DatabaseAdminView';

import {
  CheckCircle2, File, FileText, ArrowRight, Bell, Loader2, AlertCircle,
} from 'lucide-react';

type ActiveTab = 'all' | 'incoming' | 'outgoing' | 'files' | 'admin' | 'flask';

const AppShell: React.FC = () => {
  const { user, loading: authLoading } = useAuth();

  const [records, setRecords] = useState<Correspondence[]>([]);
  const [folders, setFolders] = useState<ArchiveFolder[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [cmsSettings, setCmsSettings] = useState<CmsSettings>(defaultCmsSettings);

  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<ActiveTab>('all');
  const [activeTypeFilter, setActiveTypeFilter] = useState<'all' | 'incoming' | 'outgoing'>('all');
  const [showDocketsFallback, setShowDocketsFallback] = useState(false);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formInitialType, setFormInitialType] = useState<CorrespondenceType>('incoming');
  const [editingRecord, setEditingRecord] = useState<Correspondence | null>(null);

  const [viewerCorrespondence, setViewerCorrespondence] = useState<Correspondence | null>(null);
  const [viewerStandaloneFile, setViewerStandaloneFile] = useState<FolderFile | null>(null);
  const [isDocViewerOpen, setIsDocViewerOpen] = useState(false);

  const [qrCorrespondence, setQrCorrespondence] = useState<Correspondence | null>(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  const [routingCorrespondence, setRoutingCorrespondence] = useState<Correspondence | null>(null);
  const [isFlaskModalOpen, setIsFlaskModalOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

  const loadAll = useCallback(async () => {
    setDataLoading(true);
    setDataError(null);
    try {
      const [recordsData, foldersData, cmsData] = await Promise.all([
        api.listCorrespondence(),
        api.listFolders(),
        api.getCms(),
      ]);
      setRecords(recordsData as Correspondence[]);
      setFolders(foldersData as ArchiveFolder[]);
      if (cmsData) setCmsSettings({ ...defaultCmsSettings, ...cmsData });

      if (can(user, 'viewAudit')) {
        try {
          const logs = await api.listAudit();
          setAuditLogs(logs as AuditLogEntry[]);
        } catch {
          setAuditLogs([]);
        }
      }
    } catch (err: any) {
      setDataError(err?.message || 'Failed to load registry data');
    } finally {
      setDataLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) loadAll();
  }, [user, loadAll]);

  useEffect(() => {
    if (!records.length || typeof window === 'undefined') return;
    const urlParams = new URLSearchParams(window.location.search);
    const previewId = urlParams.get('preview');
    if (!previewId) return;
    const match = records.find((r) => r.id === previewId || r.registryNo === previewId);
    if (match) {
      setViewerCorrespondence(match);
      setViewerStandaloneFile(null);
      setIsDocViewerOpen(true);
    }
  }, [records]);

  const handleOpenNewModal = (type: CorrespondenceType) => {
    setEditingRecord(null);
    setFormInitialType(type);
    setIsFormOpen(true);
  };

  const handleEditRecord = (record: Correspondence) => {
    setEditingRecord(record);
    setFormInitialType(record.type);
    setIsFormOpen(true);
  };

  const handleCreateFolder = async (newFile: ArchiveFolder) => {
    try {
      const created = await api.createFolder(newFile);
      setFolders((prev) => [created as ArchiveFolder, ...prev]);
      showToast('File "' + newFile.name + '" created');
    } catch (err: any) {
      showToast(err?.message || 'Failed to create file');
    }
  };

  const handleSaveRecord = async (savedRecord: Correspondence, fileId?: string) => {
    try {
      const exists = records.some((r) => r.id === savedRecord.id);
      if (exists) {
        const updated = await api.updateCorrespondence(savedRecord.id, savedRecord);
        setRecords((prev) => prev.map((r) => (r.id === savedRecord.id ? (updated as Correspondence) : r)));
        showToast('Updated ' + savedRecord.registryNo);
      } else {
        const created = await api.createCorrespondence(savedRecord);
        setRecords((prev) => [created as Correspondence, ...prev]);
        showToast('Filed ' + savedRecord.registryNo);

        const targetId = fileId || savedRecord.folderId;
        if (targetId) {
          const match = folders.find(
            (f) => f.id === targetId || f.folderCode === savedRecord.fileNumber
          );
          if (match) {
            // STUB_REMOVED_V2: we no longer generate a fake "[Letter] ... .pdf" placeholder.
            // Only the real uploaded attachments appear in the folder.
            
            const attachmentDocuments: FolderFile[] = savedRecord.documents.map((d) => ({
              id: d.id,
              name: d.name,
              size: d.size,
              type: d.type,
              dataUrl: d.dataUrl,
              previewContent: d.previewContent,
              uploadedAt: d.uploadedAt,
              uploadedBy: 'Registry Officer',
              notes: 'Enclosure for ' + savedRecord.registryNo,
              correspondenceId: savedRecord.id,
              correspondenceRef: savedRecord.registryNo,
            }));
            const newDocuments = [...attachmentDocuments];
            const updatedFile = await api.updateFolder(match.id, {
              ...match,
              files: [...newDocuments, ...match.files],
            });
            setFolders((prev) => prev.map((f) => (f.id === match.id ? (updatedFile as ArchiveFolder) : f)));
          }
        }
      }
      if (can(user, 'viewAudit')) {
        try { setAuditLogs(await api.listAudit() as AuditLogEntry[]); } catch {}
      }
    } catch (err: any) {
      showToast(err?.message || 'Failed to save record');
    }
  };

  const handleDeleteRecord = async (id: string) => {
    const toDelete = records.find((r) => r.id === id);
    if (!toDelete) return;
    if (!window.confirm('Remove ' + toDelete.registryNo + ' (' + toDelete.title + ') from the registry?')) return;
    try {
      await api.deleteCorrespondence(id);
      setRecords((prev) => prev.filter((r) => r.id !== id));
      showToast('Removed ' + toDelete.registryNo);
      if (can(user, 'viewAudit')) {
        try { setAuditLogs(await api.listAudit() as AuditLogEntry[]); } catch {}
      }
    } catch (err: any) {
      showToast(err?.message || 'Failed to delete');
    }
  };

  const handleSaveFolders = async (updatedFolders: ArchiveFolder[]) => {
    try {
      for (const file of updatedFolders) {
        const original = folders.find((f) => f.id === file.id);
        if (!original) {
          await api.createFolder(file);
        } else if (JSON.stringify(original) !== JSON.stringify(file)) {
          await api.updateFolder(file.id, file);
        }
      }
      setFolders(updatedFolders);
      showToast('File repositories updated');
    } catch (err: any) {
      showToast(err?.message || 'Failed to save files');
    }
  };

  const handleOpenDocViewer = (record: Correspondence) => {
    setViewerCorrespondence(record);
    setViewerStandaloneFile(null);
    setIsDocViewerOpen(true);
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('preview', record.id);
      window.history.replaceState(null, '', url.toString());
    } catch {}
  };

  const handleCloseDocViewer = () => {
    setIsDocViewerOpen(false);
    setViewerCorrespondence(null);
    setViewerStandaloneFile(null);
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('preview');
      window.history.replaceState(null, '', url.pathname + (url.search || ''));
    } catch {}
  };

  const handlePreviewStandaloneFile = (file: FolderFile) => {
    setViewerStandaloneFile(file);
    if (file.correspondenceId) {
      const parent = records.find((r) => r.id === file.correspondenceId);
      setViewerCorrespondence(parent || null);
    } else {
      setViewerCorrespondence(null);
    }
    setIsDocViewerOpen(true);
  };

  const handleOpenQrModal = (record: Correspondence) => {
    setQrCorrespondence(record);
    setIsQrModalOpen(true);
  };

  const handleSaveCmsSettings = async (newSettings: CmsSettings) => {
    try {
      const saved = await api.updateCms(newSettings);
      setCmsSettings({ ...defaultCmsSettings, ...(saved as any) });
      showToast('CMS settings updated');
    } catch (err: any) {
      showToast(err?.message || 'Failed to save CMS settings');
    }
  };

  const handleSelectTab = (tab: ActiveTab) => {
    // FILTER_ALIAS: treat 'incoming' and 'outgoing' as filters on the All Records view
    // rather than separate top-level tabs.
    if (tab === 'incoming' || tab === 'outgoing') {
      setActiveTab('all');
      setActiveTypeFilter(tab);
      setShowDocketsFallback(false);
      return;
    }
    setActiveTab(tab);
    setShowDocketsFallback(false);
    if (tab === 'all') setActiveTypeFilter('all');
    else if (tab === 'flask') setIsFlaskModalOpen(true);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-emerald-700 mx-auto animate-spin" />
          <p className="text-xs text-slate-500 mt-3">Loading MOCDE Registry...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900">
      <Header
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        onOpenNewModal={handleOpenNewModal}
        cmsSettings={cmsSettings}
        onChangePassword={() => setIsChangePasswordOpen(true)}
      />

      {cmsSettings.bannerNotice && (
        <aside className="bg-emerald-900 text-white text-xs py-2 px-4 border-b border-emerald-950 flex items-center justify-between shadow-2xs">
          <div className="max-w-7xl mx-auto w-full flex items-center gap-2">
            <Bell className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
            <span className="font-semibold text-emerald-200 uppercase tracking-wider text-[10px] shrink-0">Official Notice:</span>
            <span className="truncate text-emerald-50 text-xs">{cmsSettings.bannerNotice}</span>
          </div>
        </aside>
      )}

      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {dataError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{dataError}</span>
          </div>
        )}

        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            {cmsSettings.logoUrl && (
              <img src={cmsSettings.logoUrl} alt="Ministry Seal" className="w-12 h-12 rounded-full object-contain shrink-0 border border-slate-200 bg-white shadow-2xs mt-0.5" />
            )}
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                <span className="font-semibold text-emerald-900">{cmsSettings.stateName || 'Edo State Government of Nigeria'}</span>
                <span>.</span>
                <span>{cmsSettings.mdaName || 'Ministry of Communication & Digital Economy'}</span>
                <span>.</span>
                <span className="font-mono">Benin City</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                {cmsSettings.mdaName ? cmsSettings.mdaName + ' Registry' : 'MOCDE Correspondence & Document Registry'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl">
                Official electronic mail and document archive system. Generate scannable QR codes for every letter, preview documents directly on-screen, manage file repositories, inspect the registry audit trail, and manage CMS settings without code changes.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
            {activeTab !== 'files' ? (
              <button
                onClick={() => setActiveTab('files')}
                className="px-3 py-1.5 text-xs font-semibold text-emerald-950 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
              >
                <File className="w-3.5 h-3.5 text-emerald-800" />
                <span>Open File Repositories</span>
              </button>
            ) : (
              <button
                onClick={() => setActiveTab('all')}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Back to Mail Registry</span>
              </button>
            )}
          </div>
        </div>

        {(activeTab === 'all' || activeTab === 'incoming' || activeTab === 'outgoing') && (
          <StatsBar
            records={records}
            onFilterType={(type) => {
              setActiveTab('all');
              setActiveTypeFilter(type);
            }}
          />
        )}

        {dataLoading ? (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
            <Loader2 className="w-6 h-6 text-slate-400 mx-auto animate-spin mb-2" />
            <p className="text-xs text-slate-500">Loading registry data...</p>
          </div>
        ) : activeTab === 'admin' ? (
          <AdminView
            auditLogs={auditLogs}
            cmsSettings={cmsSettings}
            onSaveCmsSettings={handleSaveCmsSettings}
            onToast={showToast}
            onClearLogs={async () => {
              if (!window.confirm('Clear the entire audit trail?')) return;
              try {
                await api.clearAudit();
                setAuditLogs([]);
                showToast('Audit trail cleared');
              } catch (err: any) {
                showToast(err?.message || 'Failed to clear audit');
              }
            }}
          />
        
        ) : activeTab === 'files' ? (
          <FolderManagerView
            folders={folders}
            onSaveFolders={handleSaveFolders}
            onPreviewFile={handlePreviewStandaloneFile}
          />
        ) : showDocketsFallback ? (
          <FileDocketView
            records={records}
            onOpenDocViewer={handleOpenDocViewer}
            onOpenRoutingSlip={(rec) => setRoutingCorrespondence(rec)}
            onEditRecord={handleEditRecord}
          />
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs px-1">
              <span className="text-slate-500 font-medium">Official Inward & Outward Letter Register</span>
              <button
                onClick={() => setShowDocketsFallback(true)}
                className="text-xs text-slate-600 hover:text-slate-900 font-semibold flex items-center gap-1"
              >
                <span>View Chronological Document Dockets</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <CorrespondenceTable
              records={records}
              activeTypeFilter={activeTypeFilter}
              onFilterChange={(t) => {
                setActiveTypeFilter(t);
                setActiveTab(t);
              }}
              onOpenDocViewer={handleOpenDocViewer}
              onOpenRoutingSlip={(rec) => setRoutingCorrespondence(rec)}
              onOpenQrCode={handleOpenQrModal}
              onEditRecord={handleEditRecord}
              onDeleteRecord={handleDeleteRecord}
              onNewRecord={handleOpenNewModal}
            />
          </div>
        )}
      </main>

      <footer className="no-print mt-auto border-t border-slate-200 bg-white py-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {cmsSettings.logoUrl && (
              <img src={cmsSettings.logoUrl} alt="Seal" className="w-4 h-4 rounded-full object-contain shrink-0" />
            )}
            <span className="font-medium text-slate-700">{cmsSettings.mdaName}</span>
            <span>.</span>
            <span>{cmsSettings.address}</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>{cmsSettings.officialEmail}</span>
            <span>.</span>
            <span>Central Records, Archives & Document Tracking System</span>
          </div>
        </div>
      </footer>

      <CorrespondenceFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSaveRecord}
        initialType={formInitialType}
        editingRecord={editingRecord}
        existingRecords={records}
        folders={folders}
        onCreateFolder={handleCreateFolder}
      />

      <DocumentViewerModal
        isOpen={isDocViewerOpen}
        onClose={handleCloseDocViewer}
        correspondence={viewerCorrespondence}
        standaloneFile={viewerStandaloneFile}
        onOpenQrCode={handleOpenQrModal}
        cmsSettings={cmsSettings}
      />

      <QRCodeModal
        isOpen={isQrModalOpen}
        onClose={() => {
          setIsQrModalOpen(false);
          setQrCorrespondence(null);
        }}
        correspondence={qrCorrespondence}
        onOpenPreview={handleOpenDocViewer}
      />

      <RoutingSlipModal
        isOpen={!!routingCorrespondence}
        onClose={() => setRoutingCorrespondence(null)}
        correspondence={routingCorrespondence}
        cmsSettings={cmsSettings}
      />

      <FlaskBackendModal
        isOpen={isFlaskModalOpen}
        onClose={() => setIsFlaskModalOpen(false)}
      />

      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
        onSuccess={() => showToast('Password updated')}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}

// STUB_REMOVED_V2
