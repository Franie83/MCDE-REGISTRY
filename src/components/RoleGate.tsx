/**
 * RoleGate — small declarative permission wrappers.
 *
 * Usage:
 *   <RoleGate allow={["super_admin"]}>
 *     <button>Delete</button>
 *   </RoleGate>
 *
 *   <CapabilityGate action="manageUsers">
 *     <UserManagerView />
 *   </CapabilityGate>
 */
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { can, hasRole, Capability, UserRole } from '../utils/auth';

interface RoleGateProps {
  allow: UserRole[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const RoleGate: React.FC<RoleGateProps> = ({ allow, fallback = null, children }) => {
  const { user } = useAuth();
  if (!hasRole(user, ...allow)) return <>{fallback}</>;
  return <>{children}</>;
};

interface CapabilityGateProps {
  action: Capability;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const CapabilityGate: React.FC<CapabilityGateProps> = ({ action, fallback = null, children }) => {
  const { user } = useAuth();
  if (!can(user, action)) return <>{fallback}</>;
  return <>{children}</>;
};

interface RequireAuthProps {
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const RequireAuth: React.FC<RequireAuthProps> = ({ fallback = null, children }) => {
  const { user } = useAuth();
  if (!user) return <>{fallback}</>;
  return <>{children}</>;
};

export default RoleGate;