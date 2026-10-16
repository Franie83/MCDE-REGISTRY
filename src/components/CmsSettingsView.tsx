import React, { useState, useRef } from 'react';
import { CmsSettings } from '../types';
import { defaultCmsSettings, defaultEdoStateLogo } from '../utils/storage';
import { 
  Building2, 
  Upload, 
  RotateCcw, 
  Save, 
  Image as ImageIcon, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  Edit3, 
  Mail, 
  Phone, 
  MapPin, 
  UserCheck, 
  AlertCircle,
  FileText
} from 'lucide-react';

interface CmsSettingsViewProps {
  settings: CmsSettings;
  onSaveSettings: (settings: CmsSettings) => void;
}

export const CmsSettingsView: React.FC<CmsSettingsViewProps> = ({
  settings,
  onSaveSettings,
}) => {
  const [formData, setFormData] = useState<CmsSettings>(settings);
  const [newDirectorate, setNewDirectorate] = useState<string>('');
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const logoInputRef = useRef<HTMLInputElement | null>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setFormData(prev => ({
        ...prev,
        logoUrl: result
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleResetLogo = () => {
    setFormData(prev => ({
      ...prev,
      logoUrl: defaultEdoStateLogo
    }));
  };

  const handleAddDirectorate = () => {
    if (!newDirectorate.trim()) return;
    if (formData.directorates.includes(newDirectorate.trim())) {
      alert('This directorate is already registered.');
      return;
    }
    setFormData(prev => ({
      ...prev,
      directorates: [...prev.directorates, newDirectorate.trim()]
    }));
    setNewDirectorate('');
  };

  const handleRemoveDirectorate = (name: string) => {
    setFormData(prev => ({
      ...prev,
      directorates: prev.directorates.filter(d => d !== name)
    }));
  };

  const handleResetDefaults = () => {
    if (window.confirm('Are you sure you want to restore official Ministry default settings?')) {
      setFormData(defaultCmsSettings);
      onSaveSettings(defaultCmsSettings);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      {/* CMS Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <span>Ministry Administration</span>
              <span>·</span>
              <span>Content Management System (CMS)</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-800" />
              <span>Ministry Content & Branding Manager</span>
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Customize the Ministry Logo, government title, office address, active officer identity, and directorates directly without modifying any code.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Save className="w-3.5 h-3.5 text-emerald-400" />
              <span>Save All Changes</span>
            </button>
          </div>
        </div>

        {saveSuccess && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-lg text-xs flex items-center gap-2 animate-fade-in font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Ministry settings, logo, and identity successfully updated across the entire registry.</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Ministry Logo & Visual Branding */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-emerald-800" />
                <span>Ministry Logo & Insignia</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Upload your official PNG, JPG, or SVG emblem. Displayed in top headers, printable routing slips, and official letterheads.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6 pt-2">
            {/* Logo Preview Stage */}
            <div className="w-28 h-28 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center p-2 shrink-0 shadow-2xs relative group">
              {formData.logoUrl ? (
                <img
                  src={formData.logoUrl}
                  alt="Ministry Logo"
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <div className="text-center text-slate-400 text-xs">
                  <ImageIcon className="w-8 h-8 mx-auto mb-1 opacity-50" />
                  <span>No Logo</span>
                </div>
              )}
            </div>

            {/* Logo Actions */}
            <div className="space-y-2.5 text-xs flex-1">
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload New Ministry Logo</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetLogo}
                  className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium rounded-lg transition-colors"
                >
                  Revert to Official Edo State Seal
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                Recommended: Square or transparent PNG, SVG, or high-res JPG (under 4MB).
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: Government & Ministry Identity */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-200 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-800" />
              <span>Government Entity & Ministry Details</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              These details appear on official transmittal slips, digital letterheads, and exports.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">State Government Authority</label>
              <input
                type="text"
                value={formData.stateName}
                onChange={(e) => setFormData({ ...formData, stateName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-1 focus:ring-emerald-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Ministry Full Name</label>
              <input
                type="text"
                value={formData.mdaName}
                onChange={(e) => setFormData({ ...formData, mdaName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-1 focus:ring-emerald-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Department / Directorate Unit</label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-1 focus:ring-emerald-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Secretariat Headquarters Address</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-1 focus:ring-emerald-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-2">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Inward Mail Serial Prefix</label>
              <input
                type="text"
                value={formData.inwardPrefix}
                onChange={(e) => setFormData({ ...formData, inwardPrefix: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-1 focus:ring-emerald-600 font-mono uppercase"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Outward Mail Serial Prefix</label>
              <input
                type="text"
                value={formData.outwardPrefix}
                onChange={(e) => setFormData({ ...formData, outwardPrefix: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-1 focus:ring-emerald-600 font-mono uppercase"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Filing Calendar Year</label>
              <input
                type="text"
                value={formData.currentYear}
                onChange={(e) => setFormData({ ...formData, currentYear: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-1 focus:ring-emerald-600 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Active Registry Officer & Audit Stamp Profile */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-200 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-800" />
              <span>Active Registry Officer Profile</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Identifies the active officer recording entries. This name and role are stamped into the permanent Audit Log.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Active Officer Name</label>
              <input
                type="text"
                value={formData.activeOfficerName}
                onChange={(e) => setFormData({ ...formData, activeOfficerName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-1 focus:ring-emerald-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Official Designation / Title</label>
              <input
                type="text"
                value={formData.activeOfficerRole}
                onChange={(e) => setFormData({ ...formData, activeOfficerRole: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-1 focus:ring-emerald-600"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Directorates & Units List Manager */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-200 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-800" />
              <span>Ministerial Directorates & Units</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage the directorates available in dropdowns throughout the correspondence and folder workflows.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Enter new directorate name..."
                value={newDirectorate}
                onChange={(e) => setNewDirectorate(e.target.value)}
                className="text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white flex-1 focus:outline-hidden focus:ring-1 focus:ring-emerald-600"
              />
              <button
                type="button"
                onClick={handleAddDirectorate}
                className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Directorate</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
              {formData.directorates.map((dept, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between gap-2"
                >
                  <span className="font-medium text-slate-800 truncate">{dept}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveDirectorate(dept)}
                    className="text-slate-400 hover:text-red-600 p-1 transition-colors shrink-0"
                    title="Remove directorate"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Section 5: System Banner Announcement */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-200 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-emerald-800" />
              <span>Public Service System Announcement</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Displayed as a notification banner at the top of the registry dashboard.
            </p>
          </div>

          <div className="text-xs">
            <textarea
              rows={2}
              value={formData.bannerNotice}
              onChange={(e) => setFormData({ ...formData, bannerNotice: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-1 focus:ring-emerald-600"
              placeholder="e.g. Mandatory Compliance: All inter-departmental letters and memos must be recorded in the digital registry."
            />
          </div>
        </div>

        {/* Bottom Save Bar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            className="px-6 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-2 shadow-xs"
          >
            <Save className="w-4 h-4 text-emerald-400" />
            <span>Save All CMS & Branding Changes</span>
          </button>
        </div>
      </form>
    </div>
  );
};
