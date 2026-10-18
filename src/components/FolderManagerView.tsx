/**
 * FolderManagerView - manages the archive folders ("files" in UI) and their documents.
 * Code uses "folder" identifiers; UI shows "File" / "Documents" for end users.
 */
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ArchiveFolder, FolderFile, CmsSettings } from '../types';
import { formatFileSize } from '../utils/storage';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { can } from '../utils/auth';
import { StringListManagerModal } from './StringListManagerModal';
import {
  Folder, FolderPlus, Search, FileText, Eye, Download, Trash2,
  Plus, X, Building2, FileCheck,
} from 'lucide-react';

interface FolderManagerViewProps {
  folders: ArchiveFolder[];
  onSaveFolders: (folders: ArchiveFolder[]) => void;
  onPreviewFile: (file: FolderFile) => void;
  /** SMART_DELETE: called when the user deletes a [Correspondence] row.
   *  App.tsx cascades this to also remove the letter from All Records. */
  onDeleteCorrespondence?: (correspondenceId: string) => Promise<void>;
}

export const FolderManagerView: React.FC<FolderManagerViewProps> = ({
  folders,
  onSaveFolders,
  onPreviewFile,
  onDeleteCorrespondence,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedFolderId, setSelectedFolderId] = useState<string>(folders[0]?.id || '');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('all');
  
  // NEW: Local state for filtering documents inside a specific file
  const [docSearchTerm, setDocSearchTerm] = useState<string>('');

  // Create Folder modal state
  const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderCode, setNewFolderCode] = useState('');
  const [newFolderDept, setNewFolderDept] = useState('');
  const [newFolderDesc, setNewFolderDesc] = useState('');
  const [newFolderLocation, setNewFolderLocation] = useState('Central Registry Cabinet 1, Shelf A');
  const [newFolderColor, setNewFolderColor] = useState('emerald');
  const [folderFormError, setFolderFormError] = useState('');

  // Departments + storage locations from CMS
  const [departments, setDepartments] = useState<string[]>([]);
  const [storageLocations, setStorageLocations] = useState<string[]>([]);
  const [departmentModalOpen, setDepartmentModalOpen] = useState(false);
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [cmsSettings, setCmsSettings] = useState<CmsSettings | null>(null);
  const { user } = useAuth();
  const canManageDepartments = can(user, 'editCms');

  useEffect(() => {
    api.getCms()
      .then((cms) => {
        setCmsSettings(cms as CmsSettings);
        setDepartments(Array.isArray(cms?.departments) ? cms.departments : []);
        setStorageLocations(Array.isArray(cms?.storageLocations) ? cms.storageLocations : []);
      })
      .catch(() => {
        setDepartments([]);
        setStorageLocations([]);
      });
  }, []);

  const saveCmsList = async (field: 'departments' | 'storageLocations', items: string[]) => {
    if (!cmsSettings) return;
    const updated = { ...cmsSettings, [field]: items } as CmsSettings;
    const saved = await api.updateCms(updated);
    const merged = { ...cmsSettings, ...(saved as any), [field]: items } as CmsSettings;
    setCmsSettings(merged);
    if (field === 'departments') setDepartments(items);
    if (field === 'storageLocations') setStorageLocations(items);
  };

  const currentFolder = useMemo(
    () => folders.find((f) => f.id === selectedFolderId) || folders[0],
    [folders, selectedFolderId],
  );

  const totalDocumentsCount = useMemo(
    () => folders.reduce((sum, f) => sum + f.files.length, 0),
    [folders],
  );

  const totalBytes = useMemo(
    () => folders.reduce((sum, f) => sum + f.files.reduce((s, file) => s + file.size, 0), 0),
    [folders],
  );

  const searchResults = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q && selectedDeptFilter === 'all') {
      return { matchingFolders: folders, matchingFiles: [] as {
        file: FolderFile; folderName: string; folderCode: string; folderId: string;
      }[] };
    }

    const matchingFolders: ArchiveFolder[] = [];
    const matchingFiles: {
      file: FolderFile; folderName: string; folderCode: string; folderId: string;
    }[] = [];

    for (const folder of folders) {
      const matchesDept = selectedDeptFilter === 'all' || folder.department === selectedDeptFilter;
      if (!matchesDept) continue;

      const folderNameMatch = folder.name.toLowerCase().includes(q);
      const folderCodeMatch = folder.folderCode.toLowerCase().includes(q);
      const folderDescMatch = folder.description.toLowerCase().includes(q);

      let hasMatchingFiles = false;
      for (const file of folder.files) {
        const fName = file.name.toLowerCase().includes(q);
        const fNotes = file.notes ? file.notes.toLowerCase().includes(q) : false;
        const fContent = file.previewContent ? file.previewContent.toLowerCase().includes(q) : false;
        if (fName || fNotes || fContent) {
          hasMatchingFiles = true;
          matchingFiles.push({
            file,
            folderName: folder.name,
            folderCode: folder.folderCode,
            folderId: folder.id,
          });
        }
      }

      if (folderNameMatch || folderCodeMatch || folderDescMatch || hasMatchingFiles) {
        matchingFolders.push(folder);
      }
    }

    return { matchingFolders, matchingFiles };
  }, [folders, searchQuery, selectedDeptFilter]);

  // NEW: Filter documents inside the currently selected file
  const filteredDocuments = useMemo(() => {
    if (!currentFolder) return [];
    if (!docSearchTerm.trim()) return currentFolder.files;
    
    const q = docSearchTerm.toLowerCase();
    return currentFolder.files.filter((file) => {
      return (
        file.name.toLowerCase().includes(q) ||
        (file.notes && file.notes.toLowerCase().includes(q)) ||
        (file.type && file.type.toLowerCase().includes(q))
      );
    });
  }, [currentFolder, docSearchTerm]);

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim() || !newFolderCode.trim()) {
      setFolderFormError('File Name and Ministry Reference Code are required');
      return;
    }

    const newFolder: ArchiveFolder = {
      id: 'folder-' + Date.now(),
      name: newFolderName.trim(),
      folderCode: newFolderCode.trim().toUpperCase(),
      department: newFolderDept || departments[0] || '',
      description: newFolderDesc.trim(),
      physicalLocation: newFolderLocation.trim(),
      colorTag: newFolderColor,
      files: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      const created = await api.createFolder(newFolder);
      onSaveFolders([created as ArchiveFolder, ...folders]);
      setSelectedFolderId((created as ArchiveFolder).id || newFolder.id);
      setIsCreateFolderModalOpen(false);
      setNewFolderName('');
      setNewFolderCode('');
      setNewFolderDesc('');
      setFolderFormError('');
    } catch (err: any) {
      setFolderFormError(err?.message || 'Could not create file');
    }
  };

  const handleDeleteFolder = async (folder: ArchiveFolder) => {
    if (!window.confirm(
      'Delete file "' + folder.name + '"?\n\n' +
      'If this file contains any letters, deletion will be blocked ' +
      'and you will need to delete or reassign them first.',
    )) return;

    try {
      await api.deleteFolder(folder.id);
      const updated = folders.filter((f) => f.id !== folder.id);
      onSaveFolders(updated);
      if (selectedFolderId === folder.id) {
        setSelectedFolderId(updated[0]?.id || '');
      }
    } catch (err: any) {
      window.alert(err?.message || 'Could not delete file');
    }
  };

  const handleDeleteFileFromFolder = async (folderId: string, fileId: string, fileName: string) => {
    const folder = folders.find((f) => f.id === folderId);
    if (!folder) return;
    const targetFile = folder.files.find((file) => file.id === fileId);

    // SMART_DELETE: if this row is a correspondence, delete the whole letter
    if (targetFile?.correspondenceId && onDeleteCorrespondence) {
      const ref = targetFile.correspondenceRef || targetFile.correspondenceId;
      const ok = window.confirm(
        'Delete correspondence ' + ref + '?\n\n' +
        'This removes the letter from All Records along with all its ' +
        'attachments. This cannot be undone.',
      );
      if (!ok) return;
      try {
        await onDeleteCorrespondence(targetFile.correspondenceId);
        return;
      } catch (err: any) {
        window.alert(err?.message || 'Could not delete correspondence');
        return;
      }
    }

    // Otherwise: remove just the row (an orphan file with no parent letter)
    if (!window.confirm('Remove "' + fileName + '" from this file?')) return;
    const updatedFiles = folder.files.filter((file) => file.id !== fileId);
    try {
      await api.updateFolder(folderId, { ...folder, files: updatedFiles });
      onSaveFolders(
        folders.map((f) =>
          f.id === folderId ? { ...f, files: updatedFiles, updatedAt: new Date().toISOString() } : f,
        ),
      );
    } catch (err: any) {
      window.alert(err?.message || 'Could not delete document');
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <span>Electronic Records &amp; Archives</span>
              <span>?</span>
              <span>Directory of Files &amp; Documents</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Folder className="w-5 h-5 text-emerald-700" />
              <span>Ministerial Files &amp; Document Repositories</span>
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Create customized departmental files. Documents enter files through letters filed from the registry.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => setIsCreateFolderModalOpen(true)}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-2 shadow-xs"
            >
              <FolderPlus className="w-4 h-4 text-emerald-400" />
              <span>+ Create New File</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-4">
          <div className="md:col-span-8 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search across all file names, reference numbers, or contents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg bg-slate-50/50 hover:bg-white focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-400"
            />
          </div>

          <div className="md:col-span-4">
            <select
              value={selectedDeptFilter}
              onChange={(e) => setSelectedDeptFilter(e.target.value)}
              className="w-full text-xs px-3 py-2.5 border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-400"
            >
              <option value="all">All Departments ({folders.length} Files)</option>
              {departments.map((dept, i) => (
                <option key={i} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-3 mt-3 border-t border-slate-100 font-mono">
          <span>Total Files: <strong className="text-slate-900 tabular-nums">{folders.length}</strong></span>
          <span>?</span>
          <span>Correspondences Filed: <strong className="text-slate-900 tabular-nums">{totalDocumentsCount}</strong></span>
          <span>?</span>
          <span>Storage Index: <strong className="text-slate-900 tabular-nums">{formatFileSize(totalBytes)}</strong></span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Department Files ({searchResults.matchingFolders.length})
            </span>
            <button
              onClick={() => setIsCreateFolderModalOpen(true)}
              className="text-xs text-emerald-800 hover:text-emerald-950 font-semibold flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New File</span>
            </button>
          </div>

          <div className="space-y-2 max-h-[680px] overflow-y-auto pr-1">
            {searchResults.matchingFolders.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-xs text-slate-400">
                <Folder className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="font-semibold text-slate-700">No file matched your search</p>
                <p className="mt-1">Try another keyword or create a new file above.</p>
              </div>
            ) : (
              searchResults.matchingFolders.map((folder) => {
                const isSelected = currentFolder?.id === folder.id;
                return (
                  <div
                    key={folder.id}
                    onClick={() => {
                      setSelectedFolderId(folder.id);
                      setDocSearchTerm(''); // Reset document filter when switching files
                    }}
                    className={
                      'p-3.5 rounded-xl border text-xs cursor-pointer transition-all ' +
                      (isSelected
                        ? 'bg-white border-slate-900 shadow-xs ring-1 ring-slate-900/10'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/70 text-slate-700')
                    }
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2 truncate">
                        <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0">
                          <Folder className="w-4 h-4" />
                        </div>
                        <h4 className="font-bold text-slate-900 truncate text-xs">{folder.name}</h4>
                      </div>
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 shrink-0">
                        {folder.files.length} {folder.files.length === 1 ? 'document' : 'documents'}
                      </span>
                    </div>

                    <p className="text-[11px] font-mono text-emerald-900 font-semibold mb-1 truncate">
                      {folder.folderCode}
                    </p>

                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed mb-2">
                      {folder.description || 'No description provided.'}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-100 pt-2 font-mono">
                      <span className="truncate">{folder.department}</span>
                      <span>{new Date(folder.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="lg:col-span-8 space-y-4">
          {!currentFolder ? (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400">
              <Folder className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="font-semibold text-slate-700">Select a file on the left or create a new one</p>
            </div>
          ) : (
            <>
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-mono mb-1">
                      <span className="font-bold text-emerald-900">{currentFolder.folderCode}</span>
                      <span>?</span>
                      <span>{currentFolder.department}</span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900">{currentFolder.name}</h3>
                    <p className="text-xs text-slate-600 mt-1">
                      {currentFolder.description || 'Continuous storage file for official ministerial correspondence.'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-start">
                    <button
                      onClick={() => handleDeleteFolder(currentFolder)}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                      title="Delete File"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-3 border-t border-slate-100">
                  <div>
                    <span className="block text-slate-400 text-[10px] uppercase font-bold">Physical Storage</span>
                    <span className="font-medium text-slate-800 text-[11px] truncate block">
                      {currentFolder.physicalLocation || 'Central Archive'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-slate-400 text-[10px] uppercase font-bold">Total Enclosures</span>
                    <span className="font-bold font-mono text-slate-900">{currentFolder.files.length} Documents</span>
                  </div>
                  <div>
                    <span className="block text-slate-400 text-[10px] uppercase font-bold">File Size</span>
                    <span className="font-bold font-mono text-slate-900">
                      {formatFileSize(currentFolder.files.reduce((a, b) => a + b.size, 0))}
                    </span>
                  </div>
                  <div>
                    <span className="block text-slate-400 text-[10px] uppercase font-bold">Last Updated</span>
                    <span className="font-mono text-slate-700 text-[11px]">
                      {new Date(currentFolder.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-900 flex items-start gap-2">
                <span className="font-semibold">Note:</span>
                <span>Documents enter files only through Inward or Outward correspondence. Open a letter and attach documents to file them here.</span>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    File Documents &amp; Enclosures ({filteredDocuments.length})
                  </span>
                  
                  {/* NEW: Wildcard search inside the file */}
                  {currentFolder.files.length > 0 && (
                    <div className="relative w-full sm:w-64">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Filter documents..."
                        value={docSearchTerm}
                        onChange={(e) => setDocSearchTerm(e.target.value)}
                        className="w-full text-[11px] pl-8 pr-7 py-1.5 border border-slate-300 rounded-md focus:outline-hidden focus:ring-1 focus:ring-slate-400"
                      />
                      {docSearchTerm && (
                        <button
                          onClick={() => setDocSearchTerm('')}
                          className="absolute right-2 top-1.5 text-slate-400 hover:text-slate-600"
                          title="Clear filter"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {currentFolder.files.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 text-xs">
                    <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">No documents in this file yet</p>
                    <p className="mt-1">Documents appear here when letters are filed into this file from the All Records tab.</p>
                  </div>
                ) : filteredDocuments.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 text-xs">
                    <Search className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">No documents matched "{docSearchTerm}"</p>
                    <button onClick={() => setDocSearchTerm('')} className="mt-2 text-emerald-700 hover:underline">
                      Clear search
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {filteredDocuments.map((file) => (
                      <div
                        key={file.id}
                        className="p-3.5 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 mt-0.5">
                            <FileText className="w-4 h-4 text-emerald-800" />
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h5 className="font-semibold text-slate-900 truncate">{file.name}</h5>
                              <span className="text-[10px] font-mono text-slate-400 shrink-0">
                                ({formatFileSize(file.size)})
                              </span>
                            </div>

                            {file.notes && (
                              <p className="text-[11px] text-slate-600 line-clamp-1 mt-0.5">{file.notes}</p>
                            )}

                            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-1">
                              {!file.correspondenceId && (
                                <span
                                  className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border bg-amber-50 text-amber-800 border-amber-200"
                                  title="Not attached to any letter"
                                >
                                  Orphan
                                </span>
                              )}
                              <span>Added {new Date(file.uploadedAt).toLocaleDateString()}</span>
                              {file.uploadedBy && (
                                <>
                                  <span>?</span>
                                  <span>By {file.uploadedBy}</span>
                                </>
                              )}
                              {file.correspondenceRef && (
                                <>
                                  <span>?</span>
                                  <span className="text-emerald-900 font-semibold">{file.correspondenceRef}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          <button
                            onClick={() => onPreviewFile(file)}
                            className="px-3 py-1.5 text-xs font-semibold text-slate-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
                            title="Preview document"
                          >
                            <Eye className="w-3.5 h-3.5 text-emerald-800" />
                            <span>Preview</span>
                          </button>

                          <button
                            onClick={() => {
                              if (file.dataUrl) {
                                const a = document.createElement('a');
                                a.href = file.dataUrl;
                                a.download = file.name;
                                a.click();
                              } else {
                                alert('Downloading archival copy: ' + file.name);
                              }
                            }}
                            className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
                            title="Download document"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>

                          {canManageDepartments && (
                            <button
                              onClick={() => handleDeleteFileFromFolder(currentFolder.id, file.id, file.name)}
                              className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                              title="Remove document from file (super admin only)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {cmsSettings && (
        <StringListManagerModal
          isOpen={departmentModalOpen}
          onClose={() => setDepartmentModalOpen(false)}
          title="Manage Departments"
          description="Applies to every dropdown across the registry."
          items={departments}
          onSave={(items) => saveCmsList('departments', items)}
        />
      )}

      {cmsSettings && (
        <StringListManagerModal
          isOpen={locationModalOpen}
          onClose={() => setLocationModalOpen(false)}
          title="Manage Storage Locations"
          description="Suggested locations for filing files and letters."
          items={storageLocations}
          onSave={(items) => saveCmsList('storageLocations', items)}
        />
      )}

      {isCreateFolderModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2.5">
                <FolderPlus className="w-5 h-5 text-emerald-700" />
                <h3 className="text-sm font-bold text-slate-900">Create Ministerial Archive File</h3>
              </div>
              <button
                onClick={() => setIsCreateFolderModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateFolder} className="p-6 space-y-4 text-xs">
              {folderFormError && (
                <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                  {folderFormError}
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  File Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Benin Metro Fiber Optic Rehabilitation Project"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-1 focus:ring-slate-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Ministry Reference Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. EDSG/MOCDE/INFRA/2026/022"
                    value={newFolderCode}
                    onChange={(e) => setNewFolderCode(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-1 focus:ring-slate-400 font-mono uppercase"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-semibold text-slate-700">Department</label>
                    {canManageDepartments && (
                      <button
                        type="button"
                        onClick={() => setDepartmentModalOpen(true)}
                        className="text-[10px] font-semibold text-emerald-800 hover:text-emerald-950 underline"
                      >
                        + Manage departments
                      </button>
                    )}
                  </div>
                  <select
                    value={newFolderDept}
                    onChange={(e) => setNewFolderDept(e.target.value)}
                    className="w-full text-xs px-2.5 py-2 border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-1 focus:ring-slate-400"
                  >
                    <option value="">? Select department ?</option>
                    {departments.map((d, i) => (
                      <option key={i} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-semibold text-slate-700">Physical Storage Location in Registry</label>
                  {canManageDepartments && (
                    <button
                      type="button"
                      onClick={() => setLocationModalOpen(true)}
                      className="text-[10px] font-semibold text-emerald-800 hover:text-emerald-950 underline"
                    >
                      + Manage locations
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  list="storage-location-suggestions"
                  placeholder="e.g. Central Registry Room, Cabinet 2, Shelf B, Box 14"
                  value={newFolderLocation}
                  onChange={(e) => setNewFolderLocation(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-1 focus:ring-slate-400"
                />
                <datalist id="storage-location-suggestions">
                  {storageLocations.map((loc, i) => (
                    <option key={i} value={loc} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">File Description / Purpose</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Houses all contractual correspondence, contractor payment milestones."
                  value={newFolderDesc}
                  onChange={(e) => setNewFolderDesc(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-1 focus:ring-slate-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsCreateFolderModalOpen(false)}
                  className="px-4 py-2 text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-white bg-slate-900 hover:bg-slate-800 rounded-lg font-semibold shadow-xs"
                >
                  Create File
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FolderManagerView;

// SMART_DELETE