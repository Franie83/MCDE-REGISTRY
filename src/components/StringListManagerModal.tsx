/**
 * StringListManagerModal - generic add/rename/delete modal for a list of strings.
 *
 * Used by the directorate manager, storage-location manager, category manager,
 * and officer manager. The list is owned by the caller; this modal just edits
 * a copy and calls onSaved() with the result.
 */
import React, { useEffect, useState } from 'react';
import {
  X, Plus, Edit3, Trash2, Check, Loader2, AlertCircle, ListOrdered,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  items: string[];
  onSave: (items: string[]) => Promise<void> | void;
  onToast?: (msg: string) => void;
}

export const StringListManagerModal: React.FC<Props> = ({
  isOpen,
  onClose,
  title,
  description,
  items,
  onSave,
  onToast,
}) => {
  const [list, setList] = useState<string[]>([]);
  const [newName, setNewName] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setList(Array.isArray(items) ? [...items] : []);
      setNewName('');
      setEditingIndex(null);
      setEditingValue('');
      setError(null);
    }
  }, [isOpen, items]);

  if (!isOpen) return null;

  const handleAdd = () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    if (list.some((d) => d.toLowerCase() === trimmed.toLowerCase())) {
      setError('That entry already exists.');
      return;
    }
    setList([...list, trimmed]);
    setNewName('');
    setError(null);
  };

  const handleStartEdit = (index: number) => {
    setEditingIndex(index);
    setEditingValue(list[index]);
    setError(null);
  };

  const handleSaveEdit = (index: number) => {
    const trimmed = editingValue.trim();
    if (!trimmed) { setError('Name cannot be empty.'); return; }
    if (list.some((d, i) => i !== index && d.toLowerCase() === trimmed.toLowerCase())) {
      setError('That entry already exists.');
      return;
    }
    const updated = [...list];
    updated[index] = trimmed;
    setList(updated);
    setEditingIndex(null);
    setEditingValue('');
    setError(null);
  };

  const handleDelete = (index: number) => {
    if (list.length <= 1) {
      setError('At least one entry must remain.');
      return;
    }
    if (!window.confirm('Remove "' + list[index] + '"?')) return;
    setList(list.filter((_, i) => i !== index));
    setError(null);
  };

  const handleSaveAll = async () => {
    setSaving(true);
    setError(null);
    try {
      await onSave(list);
      onToast?.(title + ' updated');
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden my-6">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <ListOrdered className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">{title}</h2>
              {description && (
                <p className="text-[11px] text-slate-500">{description}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {list.map((name, index) => (
              <div
                key={index}
                className="flex items-center justify-between gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
              >
                {editingIndex === index ? (
                  <>
                    <input
                      type="text"
                      value={editingValue}
                      onChange={(e) => setEditingValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEdit(index);
                        if (e.key === 'Escape') { setEditingIndex(null); setEditingValue(''); }
                      }}
                      autoFocus
                      className="flex-1 px-2 py-1 border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                    />
                    <button
                      onClick={() => handleSaveEdit(index)}
                      className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-md"
                      title="Save"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => { setEditingIndex(null); setEditingValue(''); }}
                      className="p-1.5 text-slate-500 hover:bg-slate-200 rounded-md"
                      title="Cancel"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <>
                    <span className="font-medium text-slate-800 truncate flex-1">{name}</span>
                    <button
                      onClick={() => handleStartEdit(index)}
                      className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-white rounded-md"
                      title="Rename"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(index)}
                      disabled={list.length <= 1}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-white rounded-md disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
            <input
              type="text"
              placeholder="Add new entry..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
              className="flex-1 px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
            />
            <button
              onClick={handleAdd}
              disabled={!newName.trim()}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-lg flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-slate-200 bg-slate-50/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium text-xs"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveAll}
            disabled={saving}
            className="px-5 py-2 text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-lg font-semibold text-xs flex items-center gap-1.5"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5 text-emerald-400" />}
            <span>Save</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default StringListManagerModal;
