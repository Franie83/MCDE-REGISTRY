/**
 * AdminView - combined Administration tab.
 *
 * Sub-sections rendered by role:
 *   Audit Trail  - super_admin, hc, ps
 *   Ministry CMS - super_admin
 *   Users        - super_admin
 *   Database     - super_admin
 */
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { can } from '../utils/auth';
import { ShieldCheck, Settings, Users, Database } from 'lucide-react';
import { AuditLogView } from './AuditLogView';
import { CmsSettingsView } from './CmsSettingsView';
import { UserManagerView } from './UserManagerView';
import { DatabaseAdminView } from './DatabaseAdminView';
import { CmsSettings, AuditLogEntry } from '../types';

type Section = 'audit' | 'cms' | 'users' | 'db';

interface Props {
  auditLogs: AuditLogEntry[];
  onClearLogs: () => void | Promise<void>;
  cmsSettings: CmsSettings;
  onSaveCmsSettings: (settings: CmsSettings) => void | Promise<void>;
  onToast?: (msg: string) => void;
}

export const AdminView: React.FC<Props> = ({
  auditLogs,
  onClearLogs,
  cmsSettings,
  onSaveCmsSettings,
  onToast,
}) => {
  const { user } = useAuth();

  const canAudit = can(user, 'viewAudit');
  const canCms = can(user, 'editCms');
  const canUsers = can(user, 'manageUsers');

  // Default section depends on role
  const defaultSection: Section = canAudit
    ? 'audit'
    : canCms
      ? 'cms'
      : canUsers
        ? 'users'
        : 'db';

  const [section, setSection] = useState<Section>(defaultSection);

  const tabs: { key: Section; label: string; icon: React.ReactNode; visible: boolean }[] = [
    { key: 'audit', label: 'Audit Trail', icon: <ShieldCheck className="w-3.5 h-3.5" />, visible: canAudit },
    { key: 'cms', label: 'Ministry CMS', icon: <Settings className="w-3.5 h-3.5" />, visible: canCms },
    { key: 'users', label: 'Users', icon: <Users className="w-3.5 h-3.5" />, visible: canUsers },
    { key: 'db', label: 'Database', icon: <Database className="w-3.5 h-3.5" />, visible: canUsers },
  ];

  const visibleTabs = tabs.filter((t) => t.visible);

  return (
    <div className="space-y-5">
      {/* Sub-nav */}
      <div className="bg-white border border-slate-200 rounded-xl p-2 shadow-xs">
        <div className="flex flex-wrap items-center gap-1">
          {visibleTabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setSection(t.key)}
              className={
                'px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ' +
                (section === t.key
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')
              }
            >
              {t.icon}
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Section render */}
      {section === 'audit' && canAudit && (
        <AuditLogView logs={auditLogs} onClearLogs={onClearLogs} />
      )}

      {section === 'cms' && canCms && (
        <CmsSettingsView settings={cmsSettings} onSaveSettings={onSaveCmsSettings} />
      )}

      {section === 'users' && canUsers && (
        <UserManagerView onToast={onToast} />
      )}

      {section === 'db' && canUsers && (
        <DatabaseAdminView onToast={onToast} />
      )}
    </div>
  );
};

export default AdminView;
