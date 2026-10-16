/**
 * Role and capability helpers for the MOCDE Registry.
 *
 * Components use can(user, action) instead of hardcoding role checks.
 * This keeps the role model in one place and matches the backend exactly.
 */

import type { ApiUser } from './api';

export type UserRole = 'super_admin' | 'hc' | 'ps' | 'director' | 'staff';

export type Capability =
  | 'viewAudit'
  | 'manageUsers'
  | 'editCms'
  | 'clearAudit'
  | 'deleteCorrespondence'
  | 'deleteFolder'
  | 'editAllCorrespondence'
  | 'createCorrespondence'
  | 'createFolder'
  | 'changeOwnPassword';

const CAPABILITIES: Record<Capability, UserRole[]> = {
  viewAudit: ['super_admin', 'hc', 'ps'],
  manageUsers: ['super_admin'],
  editCms: ['super_admin'],
  clearAudit: ['super_admin'],
  deleteCorrespondence: ['super_admin'],
  deleteFolder: ['super_admin'],
  editAllCorrespondence: ['super_admin', 'hc', 'ps'],
  createCorrespondence: ['super_admin', 'hc', 'ps', 'director', 'staff'],
  createFolder: ['super_admin', 'hc', 'ps', 'director', 'staff'],
  changeOwnPassword: ['super_admin', 'hc', 'ps', 'director', 'staff'],
};

export function hasRole(user: ApiUser | null | undefined, ...roles: UserRole[]): boolean {
  if (!user) return false;
  return roles.includes(user.role as UserRole);
}

export function can(
  user: ApiUser | null | undefined,
  action: Capability,
): boolean {
  if (!user || !user.isActive) return false;
  const allowed = CAPABILITIES[action];
  if (!allowed) return false;
  return allowed.includes(user.role as UserRole);
}

/**
 * Human-readable label for a role, for badges and dropdowns.
 */
export function roleLabel(role: UserRole | string): string {
  switch (role) {
    case 'super_admin': return 'Super Admin';
    case 'hc': return 'Hon. Commissioner';
    case 'ps': return 'Permanent Secretary';
    case 'director': return 'Director';
    case 'staff': return 'Staff';
    default: return String(role);
  }
}

/**
 * Tailwind color classes for role badges.
 */
export function roleBadgeClasses(role: UserRole | string): string {
  switch (role) {
    case 'super_admin': return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'hc': return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'ps': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'director': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'staff': return 'bg-slate-100 text-slate-700 border-slate-200';
    default: return 'bg-slate-100 text-slate-700 border-slate-200';
  }
}

export const ALL_ROLES: UserRole[] = ['super_admin', 'hc', 'ps', 'director', 'staff'];