/**
 * CorrespondenceFormModal - create/edit a correspondence record.
 * Code uses folder identifiers; UI shows "Files".
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  Correspondence, CorrespondenceType, AttachedDocument, PriorityLevel,
  TreatmentStatus, ArchiveFolder,
} from '../types';
import { generateNextRegistryNumber, processUploadedFile, formatFileSize } from '../utils/storage';
import {
  Upload, X, FileText, CheckCircle2, AlertCircle,
  ArrowDownLeft, ArrowUpRight, Folder, FolderPlus, Search,
} from 'lucide-react';

interface CorrespondenceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: Correspondence, folderId?: string) => void;
  initialType?: CorrespondenceType;
  editingRecord?: Correspondence | null;
  existingRecords: Correspondence[];
  folders: ArchiveFolder[];
  onCreateFolder?: (folder: ArchiveFolder) => void;
}

export const CorrespondenceFormModal: React.FC<CorrespondenceFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialType = 'incoming',
  editingRecord = null,
  existingRecords,
  folders,
  onCreateFolder,
}) => {
  const [type, setType] = useState<CorrespondenceType>(initialType);
  const [recordDate, setRecordDate] = useState<string>('');
  const [dateOnCorrespondence, setDateOnCorrespondence] = useState<string>('');
  const [sourceOrTarget, setSourceOrTarget] = useState<string>('');
  const [title, setTitle] = useState<string>('');

  const [selectedFolderId, setSelectedFolderId] = useState<string>('');
  const [folderSearchQuery, setFolderSearchQuery] = useState<string>('');
  const [isFolderPickerOpen, setIsFolderPickerOpen] = useState(false);

  const [isCreatingNewFolder, setIsCreatingNewFolder] = useState(false);
  const [inlineFolderName, setInlineFolderName] = useState('');
  const [inlineFolderCode, setInlineFolderCode] = useState('');
  const [inlineFolderDept, setInlineFolderDept] = useState('ICT Infrastructure & Broadband');
  const [inlineFolderLocation, setInlineFolderLocation] = useState('Central Registry Cabinet 1, Shelf A');

  const [status, setStatus] = useState<TreatmentStatus>('received');
  const [documents, setDocuments] = useState<AttachedDocument[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const folderSearchInputRef = useRef<HTMLInputElement | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  const selectedFolder = folders.find((f) => f.id === selectedFolderId);

  const filteredFolders = folders.filter((f) => {
    if (!folderSearchQuery.trim()) return true;
    const q = folderSearchQuery.toLowerCase();
    return (
      f.name.toLowerCase().includes(q) ||
      f.folderCode.toLowerCase().includes(q) ||
      f.department.toLowerCase().includes(q) ||
      (f.description && f.description.toLowerCase().includes(q))
    );
  });

  useEffect(() => {
    if (editingRecord) {
      setType(editingRecord.type);
      setRecordDate(editingRecord.recordDate);
      setDateOnCorrespondence(editingRecord.dateOnCorrespondence);
      setSourceOrTarget(
        editingRecord.type === 'incoming'
          ? editingRecord.source || ''
          : editingRecord.target || '',
      );
      setTitle(editingRecord.title);

      const matched = folders.find(
        (f) => f.folderCode === editingRecord.fileNumber || f.id === editingRecord.folderId,
      );
      if (matched) setSelectedFolderId(matched.id);
      else if (folders.length > 0) setSelectedFolderId(folders[0].id);

      setStatus(editingRecord.status || 'received');
      setDocuments(editingRecord.documents || []);
    } else {
      setType(initialType);
      setRecordDate(todayStr);
      setDateOnCorrespondence(todayStr);
      setSourceOrTarget('');
      setTitle('');
      setSelectedFolderId('');
      setFolderSearchQuery('');
      setIsFolderPickerOpen(false);
      setIsCreatingNewFolder(false);
      setStatus(initialType === 'incoming' ? 'received' : 'dispatched');
      setDocuments([]);
    }
    setErrors({});
  }, [editingRecord, initialType, isOpen, folders, todayStr]);

  if (!isOpen) return null;

  const handleSelectFolder = (folder: ArchiveFolder) => {
    setSelectedFolderId(folder.id);
    setIsFolderPickerOpen(false);
    setFolderSearchQuery('');
    setErrors((prev) => {
      const next = { ...prev };
      delete next.folder;
      return next;
    });
  };

  const handleQuickCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inlineFolderName.trim() || !inlineFolderCode.trim()) {
      alert('Please provide both File Name and Ministry Reference Code');
      return;
    }
    const newFolder: ArchiveFolder = {
      id: 'folder-' + Date.now(),
      name: inlineFolderName.trim(),
      folderCode: inlineFolderCode.trim().toUpperCase(),
      department: inlineFolderDept,
      description: 'Created for correspondence registry filing.',
      physicalLocation: inlineFolderLocation.trim(),
      colorTag: 'emerald',
      files: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    if (onCreateFolder) onCreateFolder(newFolder);
    handleSelectFolder(newFolder);
    setIsCreatingNewFolder(false);
    setInlineFolderName('');
    setInlineFolderCode('');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    setIsUploading(true);
    try {
      const newDocs: AttachedDocument[] = [];
      for (let i = 0; i < fileList.length; i++) {
        const doc = await processUploadedFile(fileList[i]);
        newDocs.push(doc as AttachedDocument);
      }
      setDocuments((prev) => [...prev, ...newDocs]);
    } catch (err) {
      console.error('Error reading documents', err);
      alert('Error uploading document. Please check the document format.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveDoc = (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  };

  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    if (!selectedFolderId || !selectedFolder) {
      newErrors.folder = 'Mandatory: You must search and select an appropriate file to document this correspondence';
    }
    if (!recordDate) {
      newErrors.recordDate = (type === 'incoming' ? 'Received Date' : 'Outgoing Date') + ' is required';
    }
    if (!dateOnCorrespondence) {
      newErrors.dateOnCorrespondence = 'Date on Correspondence is required';
    }
    if (!sourceOrTarget.trim()) {
      newErrors.sourceOrTarget = (type === 'incoming'
        ? 'Source (From Whom Received)'
        : 'Target (To Whom Dispatched)') + ' is required';
    }
    if (!title.trim()) {
      newErrors.title = 'Title / Subject of correspondence is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const registryNo = editingRecord
      ? editingRecord.registryNo
      : generateNextRegistryNumber(type, existingRecords);

    const targetFolder = folders.find((f) => f.id === selectedFolderId);

    const recordToSave: Correspondence = {
      id: editingRecord ? editingRecord.id : 'corr-' + Date.now(),
      registryNo,
      type,
      recordDate,
      dateOnCorrespondence,
      source: type === 'incoming' ? sourceOrTarget.trim() : undefined,
      target: type === 'outgoing' ? sourceOrTarget.trim() : undefined,
      title: title.trim(),
      fileNumber: targetFolder ? targetFolder.folderCode : 'EDSG/MOCDE/GEN/2026',
      folderId: selectedFolderId,
      category: targetFolder?.department,
      priority: 'normal',
      status,
      physicalLocation: targetFolder?.physicalLocation,
      documents,
      createdAt: editingRecord ? editingRecord.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(recordToSave, selectedFolderId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div
        className="bg-white rounded-2xl max-w-3xl w-full border border-slate-200 shadow-2xl overflow-hidden my-4 max-h-[92vh] flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className={
              'w-9 h-9 rounded-lg flex items-center justify-center ' +
              (type === 'incoming' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800')
            }>
              {type === 'incoming' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {editingRecord
                  ? 'Edit Correspondence Record'
                  : type === 'incoming'
                    ? 'Receive & File Inward Correspondence'
                    : 'Dispatch & File Outward Correspondence'}
              </h2>
              <p className="text-xs text-slate-500">
                Edo State Ministry of Communication &amp; Digital Economy ? Central Registry
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3 overflow-y-auto flex-1">
          {!editingRecord && (
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg w-fit">
                <button
                  type="button"
                  onClick={() => { setType('incoming'); setStatus('received'); }}
                  className={
                    'px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ' +
                    (type === 'incoming' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900')
                  }
                >
                  Inward (Receiving Letter)
                </button>
                <button
                  type="button"
                  onClick={() => { setType('outgoing'); setStatus('dispatched'); }}
                  className={
                    'px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ' +
                    (type === 'outgoing' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900')
                  }
                >
                  Outward (Sending Out Letter)
                </button>
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                Mandatory File Filing Protocol
              </div>
            </div>
          )}

          <div className="bg-emerald-50/50 border border-emerald-200/80 rounded-xl p-3">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Folder className="w-4 h-4 text-emerald-700" />
                <span>Archive File Assignment (Mandatory)</span>
                <span className="text-red-500">*</span>
              </label>
              {!isCreatingNewFolder && (
                <button
                  type="button"
                  onClick={() => setIsCreatingNewFolder(true)}
                  className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 flex items-center gap-1"
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                  <span>+ Create New File</span>
                </button>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mb-2">
              Every correspondence must be filed directly into the appropriate ministerial file.
            </p>

            {isCreatingNewFolder ? (
              <div className="bg-white border border-emerald-300 rounded-lg p-3 space-y-3">
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="text-xs font-bold text-slate-800">Quick Create &amp; Select File</span>
                  <button
                    type="button"
                    onClick={() => setIsCreatingNewFolder(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-1">File Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. State GovNet Fiber Expansion"
                      value={inlineFolderName}
                      onChange={(e) => setInlineFolderName(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-1">File Reference Code *</label>
                    <input
                      type="text"
                      placeholder="e.g. EDSG/MOCDE/INFRA/2026/020"
                      value={inlineFolderCode}
                      onChange={(e) => setInlineFolderCode(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md font-mono uppercase"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsCreatingNewFolder(false)}
                    className="px-3 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleQuickCreateFolder}
                    className="px-3 py-1 text-xs bg-slate-900 text-white font-semibold rounded"
                  >
                    Save &amp; Assign File
                  </button>
                </div>
              </div>
            ) : selectedFolder ? (
              <div className="bg-white border border-emerald-300 rounded-xl p-3 flex items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 truncate">{selectedFolder.name}</span>
                      <span className="text-[11px] font-mono font-bold text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {selectedFolder.folderCode}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono mt-0.5">
                      <span>{selectedFolder.department}</span>
                      <span>?</span>
                      <span>Location: {selectedFolder.physicalLocation}</span>
                      <span>?</span>
                      <span>{selectedFolder.files.length} existing documents</span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { setSelectedFolderId(''); setIsFolderPickerOpen(true); }}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
                >
                  Change File
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    ref={folderSearchInputRef}
                    type="text"
                    placeholder="Search files by name, ref code, or directorate..."
                    value={folderSearchQuery}
                    onChange={(e) => { setFolderSearchQuery(e.target.value); setIsFolderPickerOpen(true); }}
                    onFocus={() => setIsFolderPickerOpen(true)}
                    className={
                      'w-full text-xs pl-9 pr-4 py-2.5 border rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 ' +
                      (errors.folder ? 'border-red-400 bg-red-50/20' : 'border-slate-300')
                    }
                  />
                </div>
                {errors.folder && (
                  <p className="text-[11px] text-red-600 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errors.folder}</span>
                  </p>
                )}
                <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg bg-white divide-y divide-slate-100 shadow-xs">
                  {filteredFolders.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">
                      <p>No file matched "{folderSearchQuery}"</p>
                      <button
                        type="button"
                        onClick={() => {
                          setInlineFolderName(folderSearchQuery);
                          setInlineFolderCode('EDSG/MOCDE/REC/2026/' + Math.floor(100 + Math.random() * 900));
                          setIsCreatingNewFolder(true);
                        }}
                        className="mt-2 text-emerald-800 font-semibold underline"
                      >
                        Click here to create a new file named "{folderSearchQuery}"
                      </button>
                    </div>
                  ) : (
                    filteredFolders.map((f) => (
                      <div
                        key={f.id}
                        onClick={() => handleSelectFolder(f)}
                        className="p-2.5 hover:bg-emerald-50/70 transition-colors cursor-pointer flex items-center justify-between text-xs"
                      >
                        <div className="min-w-0 pr-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 truncate">{f.name}</span>
                            <span className="font-mono text-[10px] font-semibold text-emerald-900 bg-emerald-50 px-1.5 py-0.5 rounded">
                              {f.folderCode}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 truncate mt-0.5">
                            {f.department} ? {f.physicalLocation}
                          </p>
                        </div>
                        <span className="text-[10px] font-semibold text-emerald-800 shrink-0">Select ?</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                {type === 'incoming' ? 'Received Date' : 'Outgoing Date'} <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={recordDate}
                onChange={(e) => setRecordDate(e.target.value)}
                readOnly={!editingRecord}
                disabled={!editingRecord}
                className={
                  'w-full text-sm px-3 py-1.5 border rounded-lg font-mono ' +
                  (editingRecord ? 'bg-white' : 'bg-slate-100 text-slate-600 cursor-not-allowed') +
                  ' focus:outline-hidden focus:ring-2 focus:ring-slate-400 ' +
                  (errors.recordDate ? 'border-red-400' : 'border-slate-300')
                }
              />
              {errors.recordDate && <p className="text-[11px] text-red-600 mt-1">{errors.recordDate}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Date on Correspondence <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={dateOnCorrespondence}
                onChange={(e) => setDateOnCorrespondence(e.target.value)}
                className={
                  'w-full text-sm px-3 py-1.5 border rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-400 font-mono ' +
                  (errors.dateOnCorrespondence ? 'border-red-400' : 'border-slate-300')
                }
              />
              {errors.dateOnCorrespondence && (
                <p className="text-[11px] text-red-600 mt-1">{errors.dateOnCorrespondence}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              {type === 'incoming' ? 'Source (From Whom Received)' : 'Target (To Whom Dispatched)'}{' '}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={sourceOrTarget}
              onChange={(e) => setSourceOrTarget(e.target.value)}
              placeholder={type === 'incoming' ? 'e.g. Office of the Executive Governor, NITDA, EIRS' : 'e.g. EDOGIS, Ministry of Finance'}
              className={
                'w-full text-sm px-3 py-1.5 border rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-400 ' +
                (errors.sourceOrTarget ? 'border-red-400' : 'border-slate-300')
              }
            />
            {errors.sourceOrTarget && <p className="text-[11px] text-red-600 mt-1">{errors.sourceOrTarget}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Title / Subject of Correspondence <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={2}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Submission of Technical Feasibility Report"
              className={
                'w-full text-sm px-3 py-1.5 border rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-400 ' +
                (errors.title ? 'border-red-400' : 'border-slate-300')
              }
            />
            {errors.title && <p className="text-[11px] text-red-600 mt-1">{errors.title}</p>}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-slate-700">
                Uploaded Documents
              </label>
              <span className="text-[11px] text-slate-500">
                {documents.length} {documents.length === 1 ? 'document' : 'documents'} attached
              </span>
            </div>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-slate-400 bg-slate-50/50 hover:bg-slate-50 rounded-xl p-3 text-center cursor-pointer transition-colors"
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Upload className="w-5 h-5 text-slate-400 mx-auto mb-1" />
              <p className="text-xs font-medium text-slate-800">Click to browse or drag &amp; drop documents here</p>
              <p className="text-[11px] text-slate-400 mt-0.5">PDF letters, Word docs, scanned images, spreadsheets</p>
            </div>
            {documents.length > 0 && (
              <div className="mt-2 space-y-1.5 max-h-32 overflow-y-auto pr-1">
                {documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 text-xs">
                    <div className="flex items-center gap-2 truncate pr-2">
                      <FileText className="w-4 h-4 text-slate-500 shrink-0" />
                      <span className="font-medium text-slate-800 truncate">{doc.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0">({formatFileSize(doc.size)})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveDoc(doc.id)}
                      className="text-slate-400 hover:text-red-600 p-1 rounded-md transition-colors shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 pb-1 border-t border-slate-200 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-lg shadow-sm transition-colors"
            >
              {editingRecord
                ? 'Update Record'
                : type === 'incoming'
                  ? 'Receive & File into Folder'
                  : 'Dispatch & File into Folder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CorrespondenceFormModal;
