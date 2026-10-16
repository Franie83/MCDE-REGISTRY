/**
 * DepartmentManagerModal - thin wrapper around StringListManagerModal
 * so existing call sites keep working.
 */
import React from 'react';
import api from '../utils/api';
import { CmsSettings } from '../types';
import { StringListManagerModal } from './StringListManagerModal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  settings: CmsSettings;
  onSaved: (updated: CmsSettings) => void;
  onToast?: (msg: string) => void;
}

export const DepartmentManagerModal: React.FC<Props> = ({
  isOpen,
  onClose,
  settings,
  onSaved,
  onToast,
}) => {
  const handleSave = async (items: string[]) => {
    const saved = await api.updateCms({ ...settings, departments: items });
    onSaved({ ...settings, ...(saved as any), departments: items });
  };

  return (
    <StringListManagerModal
      isOpen={isOpen}
      onClose={onClose}
      title="Manage Departments"
      description="Applies to every dropdown across the registry."
      items={Array.isArray(settings.departments) ? settings.departments : []}
      onSave={handleSave}
      onToast={onToast}
    />
  );
};

export default DepartmentManagerModal;
