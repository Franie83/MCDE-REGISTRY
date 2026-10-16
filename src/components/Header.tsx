/**
 * Header.tsx - top navigation bar.
 *
 * Left:  Ministry wordmark + logo (from CMS)
 * Middle: navigation tabs, filtered by role capability
 * Right: user chip (name + role badge) with a dropdown for
 *        Change Password, User Management (super_admin only), Logout
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  ShieldCheck, Settings, File, Terminal,
  ArrowDownLeft, ArrowUpRight, Users, KeyRound, LogOut, ChevronDown,
  Database,
} from 'lucide-react';
import { CmsSettings } from '../types';
import { useAuth } from '../context/AuthContext';
import { can, roleLabel, roleBadgeClasses } from '../utils/auth';
import { ChangePasswordModal } from './ChangePasswordModal';

interface HeaderProps {
  activeTab:
    | 'all' | 'incoming' | 'outgoing' | 'files'
    | 'admin' | 'flask';
  onSelectTab: (
    tab:
      | 'all' | 'incoming' | 'outgoing' | 'files'
      | 'admin' | 'flask'
  ) => void;
  onOpenNewModal: (type: 'incoming' | 'outgoing') => void;
  cmsSettings?: CmsSettings;
  onChangePassword: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  onOpenNewModal,
  cmsSettings,
  onChangePassword,
}) => {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [forcePasswordOpen, setForcePasswordOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Close the user menu when clicking outside it.
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // If the user still has the mustChangePassword flag on, force the modal.
  useEffect(() => {
    if (user?.mustChangePassword) setForcePasswordOpen(true);
  }, [user?.mustChangePassword]);

  const showAudit = can(user, 'viewAudit');
  const showUsers = can(user, 'manageUsers');
  const showCms = can(user, 'editCms');

  const tabCls = (tab: string) =>
    'hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 pb-1 ' +
    (activeTab === tab ? 'text-slate-950 font-semibold border-b-2 border-slate-900' : '');

  return (
    <>
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 h-16">

            {/* Zone 1: wordmark */}
            <button
              onClick={() => onSelectTab('all')}
              className="flex items-center gap-3 shrink-0 text-left hover:opacity-90 transition-opacity"
              title="Go to Registry Overview"
            >
              {cmsSettings?.logoUrl ? (
                <img
                  src={cmsSettings.logoUrl}
                  alt="Ministry Seal"
                  className="w-9 h-9 rounded-full object-contain shrink-0 border border-slate-200 bg-white shadow-2xs"
                />
              ) : (
                <span className="w-3 h-3 rounded-full bg-emerald-600 shrink-0 inline-block"></span>
              )}
              <div className="flex flex-col">
                <span className="text-sm sm:text-base font-bold tracking-tight text-slate-900 leading-tight">
                  {cmsSettings?.mdaName
                    ? cmsSettings.mdaName.replace('Ministry of ', 'MOCDE ')
                    : 'Edo MOCDE Registry'}
                </span>
                <span className="text-[10px] text-slate-500 font-medium leading-none mt-0.5">
                  {cmsSettings?.stateName || 'Edo State Government'}
                </span>
              </div>
            </button>

            {/* Zone 2: nav tabs */}
            <nav className="hidden lg:flex items-center gap-5 text-sm font-medium text-slate-600">
              <button onClick={() => onSelectTab('all')} className={tabCls('all')}>All Records</button>
              <button onClick={() => onSelectTab('files')} className={tabCls('files')}>Files &amp; Documents</button>

              {(showAudit || showCms || showUsers) && (
                <button
                  onClick={() => onSelectTab('admin')}
                  className={tabCls('admin') + ' flex items-center gap-1.5'}
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-800" />
                  <span>Administration</span>
                </button>
              )}
            </nav>

            {/* Zone 3: quick actions + user chip */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => onOpenNewModal('incoming')}
                className="px-3 sm:px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 shadow-xs"
              >
                <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">+ Inward</span>
              </button>
              <button
                onClick={() => onOpenNewModal('outgoing')}
                className="px-2.5 sm:px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1"
              >
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">+ Outward</span>
              </button>

              {user && (
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setMenuOpen((v) => !v)}
                    className="flex items-center gap-2 pl-2 pr-2 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                    title={user.fullName}
                  >
                    <span className={'text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border ' + roleBadgeClasses(user.role)}>
                      {user.role}
                    </span>
                    <span className="hidden md:inline text-xs font-semibold text-slate-800 max-w-[140px] truncate">
                      {user.fullName}
                    </span>
                    <ChevronDown className={'w-3.5 h-3.5 text-slate-500 transition-transform ' + (menuOpen ? 'rotate-180' : '')} />
                  </button>

                  {menuOpen && (
                    <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden z-40">
                      <div className="px-3 py-2.5 border-b border-slate-100 bg-slate-50">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900 truncate">{user.fullName}</span>
                          <span className={'text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ' + roleBadgeClasses(user.role)}>
                            {roleLabel(user.role)}
                          </span>
                        </div>
                        <div className="font-mono text-[10px] text-slate-500 mt-0.5">
                          @{user.username}
                          {user.department && ' . ' + user.department}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          onChangePassword();
                        }}
                        className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <KeyRound className="w-3.5 h-3.5 text-slate-500" />
                        <span>Change Password</span>
                      </button>
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          logout();
                        }}
                        className="w-full text-left px-3 py-2 text-xs text-red-700 hover:bg-red-50 flex items-center gap-2 border-t border-slate-100"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Mobile nav */}
          <div className="flex lg:hidden overflow-x-auto py-2 border-t border-slate-100 gap-2 scrollbar-none text-xs">
            <button onClick={() => onSelectTab('all')} className={'px-2.5 py-1 rounded whitespace-nowrap ' + (activeTab === 'all' ? 'bg-slate-900 text-white font-medium' : 'text-slate-600')}>All</button>
            <button onClick={() => onSelectTab('files')} className={'px-2.5 py-1 rounded whitespace-nowrap ' + (activeTab === 'files' ? 'bg-slate-900 text-white font-medium' : 'text-slate-600')}>Files</button>
            {(showAudit || showCms || showUsers) && (
              <button onClick={() => onSelectTab('admin')} className={'px-2.5 py-1 rounded whitespace-nowrap ' + (activeTab === 'admin' ? 'bg-slate-900 text-white font-medium' : 'text-slate-600')}>Administration</button>
            )}
          </div>
        </div>
      </header>

      {/* Forced password change on first login */}
      <ChangePasswordModal
        isOpen={forcePasswordOpen}
        onClose={() => setForcePasswordOpen(false)}
        onSuccess={() => setForcePasswordOpen(false)}
      />
    </>
  );
};

// INWARD_OUTWARD_REMOVED
