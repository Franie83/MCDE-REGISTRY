/**
 * LoginView - the entry screen for the MOCDE Registry.
 *
 * Username + password form, error banner, quick-access buttons (dev only),
 * and forced password change when mustChangePassword === true.
 */
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { roleLabel, roleBadgeClasses, UserRole } from '../utils/auth';
import { Lock, User, Eye, EyeOff, ShieldCheck, Loader2, AlertCircle, Building2, KeyRound } from 'lucide-react';

const DEV_PASSWORD = 'ChangeMe!2026';

const QUICK_USERS: { username: string; role: UserRole }[] = [
  { username: 'superadmin', role: 'super_admin' },
  { username: 'hc', role: 'hc' },
  { username: 'ps', role: 'ps' },
  { username: 'director', role: 'director' },
  { username: 'staff', role: 'staff' },
];

export const LoginView: React.FC = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dev-mode detection that works in every environment.
  const isDev =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' ||
     window.location.hostname === '127.0.0.1');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Please enter both username and password.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await login(username.trim(), password);
    } catch (err: any) {
      setError(err?.message || 'Login failed. Check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickLogin = async (u: { username: string; role: UserRole }) => {
    setUsername(u.username);
    setPassword(DEV_PASSWORD);
    setSubmitting(true);
    setError(null);
    try {
      await login(u.username, DEV_PASSWORD);
    } catch (err: any) {
      setError(err?.message || 'Quick login failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-800 text-white mb-3 shadow-md">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Edo State MOCDE Registry</h1>
          <p className="text-xs text-slate-500 mt-1">Ministry of Communication &amp; Digital Economy</p>
          <p className="text-[11px] text-slate-400 mt-0.5 font-mono">Central Correspondence &amp; Document Registry</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/60">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-emerald-800" />
              <span>Registry Sign-In</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Enter your Ministry credentials to access the registry.</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Username</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. superadmin"
                  className="w-full text-sm pl-9 pr-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
                  disabled={submitting}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full text-sm pl-9 pr-10 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
                  disabled={submitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 p-0.5"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>

          {isDev && (
            <div className="border-t border-slate-200 bg-amber-50/40 px-6 py-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">Quick Access (Dev Mode Only)</span>
                <span className="text-[10px] font-mono text-amber-700">pwd: {DEV_PASSWORD}</span>
              </div>
              <p className="text-[11px] text-amber-900/70 mb-3">These buttons never appear on the deployed site. They only show in local dev.</p>
              <div className="grid grid-cols-2 gap-2">
                {QUICK_USERS.map((u) => (
                  <button
                    key={u.username}
                    type="button"
                    onClick={() => handleQuickLogin(u)}
                    disabled={submitting}
                    className="px-3 py-2 text-xs font-medium rounded-lg border border-amber-200 transition-colors hover:bg-amber-100 disabled:opacity-50 text-left flex items-center justify-between gap-2 bg-white"
                    title={'Login as ' + u.username}
                  >
                    <span className="flex flex-col items-start min-w-0">
                      <span className="font-semibold text-slate-900 truncate">{roleLabel(u.role)}</span>
                      <span className="font-mono text-[10px] text-slate-500 truncate">{u.username}</span>
                    </span>
                    <span className={'text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border shrink-0 ' + roleBadgeClasses(u.role)}>
                      {u.role}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="text-center mt-6 text-[11px] text-slate-400">
          <p className="flex items-center justify-center gap-1.5">
            <Building2 className="w-3 h-3" />
            <span>Edo State Government of Nigeria - Benin City</span>
          </p>
          <p className="mt-0.5">Contact the Central Registry if you cannot sign in.</p>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
