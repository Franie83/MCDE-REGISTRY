/**
 * UserManagerView - Super Admin only.
 * Create, edit, reset passwords, deactivate, and delete users.
 */
import React, { useEffect, useMemo, useState } from 'react';
import api, { ApiUser } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { ALL_ROLES, UserRole, roleLabel, roleBadgeClasses } from '../utils/auth';
import {
  Users, UserPlus, Search, Edit3, Trash2, KeyRound,
  CheckCircle2, XCircle, Loader2, AlertCircle, X, Save,
  Shield, Building2, Mail,
} from 'lucide-react';

interface Props {
  onToast?: (message: string) => void;
}

interface FormState {
  id?: number;
  username: string;
  fullName: string;
  email: string;
  role: UserRole;
  department: string;
  isActive: boolean;
  password: string;
}

const EMPTY_FORM: FormState = {
  username: '',
  fullName: '',
  email: '',
  role: 'staff',
  department: '',
  isActive: true,
  password: '',
};

export const UserManagerView: React.FC<Props> = ({ onToast }) => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [departments, setDepartments] = useState<string[]>([]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await api.listUsers();
      setUsers(list);
    } catch (err: any) {
      setError(err?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const loadDepartments = async () => {
    try {
      const cms = await api.getCms();
      setDepartments(Array.isArray(cms?.departments) ? cms.departments : []);
    } catch {
      setDepartments([]);
    }
  };

  useEffect(() => {
    load();
    loadDepartments();
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.toLowerCase();
    return users.filter((u) =>
      u.username.toLowerCase().includes(q) ||
      u.fullName.toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    );
  }, [users, search]);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (u: ApiUser) => {
    setForm({
      id: u.id,
      username: u.username,
      fullName: u.fullName,
      email: u.email || '',
      role: u.role as UserRole,
      department: u.department || '',
      isActive: u.isActive,
      password: '',
    });
    setFormError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setFormError(null);
  };

  const handleSave = async () => {
    if (!form.username.trim()) return setFormError('Username is required');
    if (!form.fullName.trim()) return setFormError('Full name is required');
    if (!form.id && !form.password) return setFormError('Password is required for new users');
    if (form.password && form.password.length < 8) return setFormError('Password must be at least 8 characters');
    if (form.role === 'director' && !form.department.trim()) return setFormError('Director role requires a department');

    setSaving(true);
    setFormError(null);
    try {
      if (form.id) {
        const payload: any = {
          fullName: form.fullName.trim(),
          email: form.email.trim() || null,
          role: form.role,
          department: form.department.trim() || null,
          isActive: form.isActive,
        };
        if (form.password) payload.password = form.password;
        await api.updateUser(form.id, payload);
        onToast?.('User updated');
      } else {
        await api.createUser({
          username: form.username.trim().toLowerCase(),
          fullName: form.fullName.trim(),
          email: form.email.trim() || undefined,
          role: form.role,
          department: form.department.trim() || undefined,
          isActive: form.isActive,
          password: form.password,
        } as any);
        onToast?.('User created');
      }
      closeModal();
      await load();
    } catch (err: any) {
      setFormError(err?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async (u: ApiUser) => {
    if (!window.confirm(`Reset ${u.username} password to ChangeMe!2026?`)) return;
    try {
      await api.updateUser(u.id, { password: 'ChangeMe!2026' } as any);
      onToast?.(`Password reset for ${u.username}`);
      await load();
    } catch (err: any) {
      onToast?.(err?.message || 'Reset failed');
    }
  };

  const handleApprove = async (u: ApiUser) => {
    if (!window.confirm('Approve ' + u.username + '? They will be able to sign in immediately.')) return;
    try {
      await api.updateUser(u.id, { isActive: true } as any);
      onToast?.('Approved ' + u.username);
      await load();
    } catch (err: any) {
      onToast?.(err?.message || 'Failed to approve');
    }
  };

  const handleDelete = async (u: ApiUser) => {
    if (u.id === currentUser?.id) {
      onToast?.('You cannot delete your own account');
      return;
    }
    if (!window.confirm(`Permanently delete ${u.username}? This cannot be undone.`)) return;
    try {
      await api.deleteUser(u.id);
      onToast?.(`Deleted ${u.username}`);
      await load();
    } catch (err: any) {
      onToast?.(err?.message || 'Delete failed');
    }
  };

  return (
    <div className="space-y-5">
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <span>Administration</span>
              <span>.</span>
              <span>Access Control</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-800" />
              <span>User Management</span>
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Create accounts, assign roles, and set department scoping for the Director role.
            </p>
          </div>
          <button
            onClick={openCreate}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-2 shadow-xs shrink-0"
          >
            <UserPlus className="w-4 h-4 text-emerald-400" />
            <span>New User</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-4">
          <div className="md:col-span-8 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by username, name, email, or role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg bg-slate-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>
          <div className="md:col-span-4 flex items-center justify-end text-xs text-slate-500 font-mono gap-4">
            <span>Total: <strong className="text-slate-900">{users.length}</strong></span>
            <span>Active: <strong className="text-emerald-700">{users.filter(u => u.isActive).length}</strong></span>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <Loader2 className="w-6 h-6 text-slate-400 mx-auto animate-spin mb-2" />
          <p className="text-xs text-slate-500">Loading users...</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Username</th>
                  <th className="py-3 px-4">Full Name</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Last Login</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="font-semibold text-slate-700">No users match your search</p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {u.username}
                        {u.id === currentUser?.id && (
                          <span className="ml-2 text-[10px] font-sans font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">you</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900">{u.fullName}</div>
                        {u.email && (
                          <div className="text-[10px] text-slate-400 font-mono truncate">{u.email}</div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${roleBadgeClasses(u.role)}`}>
                          {roleLabel(u.role)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {u.department || <span className="text-slate-300">-</span>}
                      </td>
                      <td className="py-3 px-4">
                        {u.isActive ? (
                          <span className="inline-flex items-center gap-1 text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded text-[10px] font-semibold">
                            <CheckCircle2 className="w-3 h-3" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-amber-800 bg-amber-50 px-2 py-0.5 rounded text-[10px] font-semibold">
                            <XCircle className="w-3 h-3" /> Pending Approval
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : <span className="text-slate-300">Never</span>}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {!u.isActive && (
                            <button
                              onClick={() => handleApprove(u)}
                              className="p-1.5 text-emerald-700 hover:text-emerald-900 rounded-md hover:bg-emerald-50 transition-colors"
                              title="Approve this account"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => openEdit(u)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 rounded-md hover:bg-slate-100 transition-colors"
                            title="Edit user"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleResetPassword(u)}
                            className="p-1.5 text-slate-500 hover:text-amber-800 rounded-md hover:bg-amber-50 transition-colors"
                            title="Reset password to ChangeMe!2026"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(u)}
                            disabled={u.id === currentUser?.id}
                            className="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Delete user"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden my-6">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2.5">
                <Shield className="w-5 h-5 text-emerald-700" />
                <h3 className="text-sm font-bold text-slate-900">
                  {form.id ? 'Edit User' : 'Create New User'}
                </h3>
              </div>
              <button onClick={closeModal} className="p-1 text-slate-400 hover:text-slate-600 rounded-md">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {formError && (
                <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Username *</label>
                  <input
                    type="text"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    disabled={!!form.id}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600 disabled:bg-slate-100 disabled:text-slate-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Role *</label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  >
                    {ALL_ROLES.map((r) => (
                      <option key={r} value={r}>{roleLabel(r)} ({r})</option>
                    ))}
                  </select>
                </div>
                {form.role === 'director' && (
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Department *</label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                      <select
                        value={form.department}
                        onChange={(e) => setForm({ ...form, department: e.target.value })}
                        className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                      >
                        <option value="">-- Select department --</option>
                        {departments.map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {form.id ? 'Reset Password (leave blank to keep current)' : 'Password *'}
                </label>
                <input
                  type="text"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder={form.id ? 'Blank = no change' : 'At least 8 characters'}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600 font-mono"
                />
                {!form.id && (
                  <p className="text-[11px] text-slate-500 mt-1">
                    The new user will be prompted to change this on first login.
                  </p>
                )}
              </div>

              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="rounded border-slate-300"
                />
                <span className="text-slate-700">Account is active</span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-slate-200 bg-slate-50/50">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2 text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-lg font-semibold text-xs flex items-center gap-1.5 shadow-xs"
              >
                {saving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5 text-emerald-400" />
                )}
                <span>{form.id ? 'Save Changes' : 'Create User'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagerView;
