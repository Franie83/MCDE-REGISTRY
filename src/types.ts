export type CorrespondenceType = 'incoming' | 'outgoing';

export type PriorityLevel = 'normal' | 'urgent' | 'immediate';

export type TreatmentStatus = 
  | 'received'          // Logged into registry
  | 'minuted'           // Passed to Director / Action Officer
  | 'in_treatment'      // Under review / reply drafted
  | 'dispatched'        // Outgoing letter sent
  | 'archived';         // Filed into jacket in cabinet

export interface AttachedDocument {
  id: string;
  name: string;
  size: number;
  type: string;
  dataUrl?: string;              // base64 or blob URL for in-browser preview
  previewContent?: string;       // rich text or markdown preview
  uploadedAt: string;
  /** Raw File object held between form submit and Cloudinary upload (not persisted) */
  file?: File;
  /** Real Cloudinary URL after upload */
  cloudinaryUrl?: string;
  /** Cloudinary public_id, used for delete */
  cloudinaryPublicId?: string;
}

export interface Correspondence {
  id: string;
  registryNo: string;           // E.g. EDSG/MOCDE/INW/2026/0014
  type: CorrespondenceType;
  
  // Specific date fields required by user
  recordDate: string;           // Received Date or Outgoing Date [YYYY-MM-DD]
  dateOnCorrespondence: string; // Date printed on the letter itself [YYYY-MM-DD]
  
  // Origin / Destination
  source?: string;              // For incoming: Sender organization / individual
  target?: string;              // For outgoing: Target recipient organization / ministry
  recipient?: string;           // For incoming: internal recipient (HC / PS / Director...)
  
  // Core indexing
  title: string;                // Subject / Title of correspondence
  fileNumber: string;           // File Number (e.g. EDSG/MOCDE/INFRA/2026/008)
  
  // Letter body text for direct on-screen reading
  letterBody?: string;
  signatory?: string;           // E.g. "Hon. Commissioner" or "Permanent Secretary"
  
  // Registry metadata to help MDA locate physical copies and trace workflows
  category?: string;            // Policy, Broadband Infrastructure, Digital Skills, Administration
  priority: PriorityLevel;
  status: TreatmentStatus;
  actionOfficer?: string;       // Assigned Department or Officer
  physicalLocation?: string;    // Cabinet / Shelf / Box location
  folioNumber?: string;         // Page/Folio reference inside the physical file jacket
  remarks?: string;             // Minuting notes or dispatch tracking notes
  dispatchMethod?: string;      // E.g. Hand Delivery, Dispatch Rider, Courier
  
  // Folder ID this correspondence belongs to
  folderId?: string;
  
  // Multi-document uploads
  documents: AttachedDocument[];
  
  createdAt: string;
  updatedAt: string;
}

export interface FolderFile {
  id: string;
  name: string;
  size: number;
  type: string;
  dataUrl?: string;          // Data URL for preview & download
  previewContent?: string;   // Text or rich preview content
  uploadedAt: string;
  uploadedBy?: string;
  notes?: string;
  correspondenceId?: string; // If linked to an official letter
  correspondenceRef?: string;
}

export interface ArchiveFolder {
  id: string;
  name: string;              // E.g. "Edo GovNet Fiber Broadband Expansion"
  folderCode: string;        // E.g. "EDSG/MOCDE/INFRA/2026/008"
  department: string;        // E.g. "ICT Infrastructure & Broadband"
  description: string;
  physicalLocation: string; // E.g. "Central Registry Cabinet 1, Shelf A"
  colorTag: string;          // E.g. "emerald", "blue", "amber", "purple", "slate"
  files: FolderFile[];
  createdAt: string;
  updatedAt: string;
}

export type AuditActionType = 
  | 'CREATE_CORRESPONDENCE'
  | 'UPDATE_CORRESPONDENCE'
  | 'DELETE_CORRESPONDENCE'
  | 'CREATE_FOLDER'
  | 'UPDATE_FOLDER'
  | 'DELETE_FOLDER'
  | 'MOVE_TO_FOLDER'
  | 'UPLOAD_ATTACHMENT'
  | 'DELETE_ATTACHMENT'
  | 'PREVIEW_DOCUMENT'
  | 'GENERATE_QR'
  | 'UPDATE_CMS_SETTINGS'
  | 'EXPORT_AUDIT_LOG';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: AuditActionType;
  actor: string;
  actorRole: string;
  entityType: 'correspondence' | 'folder' | 'document' | 'cms';
  entityId: string;
  entityRef: string;
  title: string;
  details: string;
  workstation: string;
}

export interface CmsSettings {
  stateName: string;
  mdaName: string;
  department: string;
  address: string;
  logoUrl?: string;
  inwardPrefix: string;
  outwardPrefix: string;
  currentYear: string;
  officialEmail: string;
  officialPhone: string;
  activeOfficerName: string;
  activeOfficerRole: string;
  bannerNotice: string;
  directorates: string[];
  stampUrl?: string;             // Official registry stamp image (separate from logo)
  storageLocations?: string[];
  categories?: string[];
  officers?: string[];
}

export interface FilterOptions {
  searchQuery: string;
  type: 'all' | 'incoming' | 'outgoing';
  fileNumber?: string;
  category?: string;
  status?: string;
  priority?: string;
  startDate?: string;
  endDate?: string;
}
