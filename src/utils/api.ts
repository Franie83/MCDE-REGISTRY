/**
 * API client for the Edo State MOCDE Registry.
 *
 * Reads VITE_API_URL from .env (falls back to http://127.0.0.1:5000 for local dev).
 * Injects the JWT Authorization header on every authenticated request.
 * On 401, clears the stored token so the app can redirect to login.
 */

const API_BASE =
  (import.meta as any)?.env?.VITE_API_URL?.replace(/\/+$/, '') ||
  'http://127.0.0.1:5000';

const TOKEN_KEY = 'edo_mocde_token';
const USER_KEY = 'edo_mocde_user';

export interface ApiUser {
  id: number;
  username: string;
  fullName: string;
  email: string | null;
  role: 'super_admin' | 'hc' | 'ps' | 'director' | 'staff';
  department: string | null;
  isActive: boolean;
  mustChangePassword: boolean;
  createdAt: string | null;
  lastLogin: string | null;
}

export class ApiError extends Error {
  status: number;
  payload: any;
  constructor(status: number, message: string, payload: any = null) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

// ── Token + user storage ─────────────────────────────────────────────
export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {}
}

export function clearToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch {}
}

export function getStoredUser(): ApiUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as ApiUser) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user: ApiUser): void {
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {}
}

// ── Core request helper ──────────────────────────────────────────────
async function request<T = any>(
  path: string,
  options: RequestInit = {},
  expectJson = true,
): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> | undefined),
  };

  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  if (options.body && !(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  let payload: any = null;
  if (expectJson) {
    try {
      payload = await res.json();
    } catch {
      payload = null;
    }
  }

  if (!res.ok) {
    if (res.status === 401) {
      clearToken();
      // Let the app decide whether to redirect; we just surface the error.
    }
    const message = (payload && (payload.error || payload.message)) || `HTTP ${res.status}`;
    throw new ApiError(res.status, message, payload);
  }

  return payload as T;
}

// ── Auth ─────────────────────────────────────────────────────────────
export const api = {
  baseUrl: API_BASE,

  async login(username: string, password: string): Promise<{ token: string; user: ApiUser }> {
    const data = await request<{ token: string; user: ApiUser }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    setToken(data.token);
    setStoredUser(data.user);
    return data;
  },

  async publicDepartments(): Promise<string[]> {
    const data = await request<{ departments: string[] }>('/api/public/departments');
    return data.departments || [];
  },

  async publicBranding(): Promise<{
    logoUrl?: string | null;
    mdaName?: string | null;
    stateName?: string | null;
    address?: string | null;
  }> {
    return await request('/api/public/branding');
  },

  async register(payload: {
    username: string;
    fullName: string;
    password: string;
    email?: string;
    department?: string;
  }): Promise<{ message: string; user: ApiUser }> {
    return await request<{ message: string; user: ApiUser }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async me(): Promise<ApiUser> {
    const data = await request<{ user: ApiUser }>('/api/auth/me');
    setStoredUser(data.user);
    return data.user;
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<ApiUser> {
    const data = await request<{ user: ApiUser }>('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    setStoredUser(data.user);
    return data.user;
  },

  logout(): void {
    clearToken();
  },

  // ── Users (super_admin) ────────────────────────────────────────────
  async listUsers(): Promise<ApiUser[]> {
    const data = await request<{ users: ApiUser[] }>('/api/users');
    return data.users;
  },

  async createUser(payload: Partial<ApiUser> & { username: string; fullName: string; role: string; password?: string }): Promise<ApiUser> {
    const data = await request<{ user: ApiUser }>('/api/users', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return data.user;
  },

  async updateUser(id: number, payload: Partial<ApiUser> & { password?: string }): Promise<ApiUser> {
    const data = await request<{ user: ApiUser }>(`/api/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return data.user;
  },

  async deleteUser(id: number): Promise<void> {
    await request(`/api/users/${id}`, { method: 'DELETE' });
  },

  // ── Correspondence ─────────────────────────────────────────────────
  async listCorrespondence(): Promise<any[]> {
    const data = await request<{ data: any[] }>('/api/correspondence');
    return data.data;
  },

  async createCorrespondence(record: any): Promise<any> {
    const data = await request<{ record: any }>('/api/correspondence', {
      method: 'POST',
      body: JSON.stringify(record),
    });
    return data.record;
  },

  async updateCorrespondence(id: string, record: any): Promise<any> {
    const data = await request<{ record: any }>(`/api/correspondence/${id}`, {
      method: 'PUT',
      body: JSON.stringify(record),
    });
    return data.record;
  },

  async deleteCorrespondence(id: string): Promise<void> {
    await request(`/api/correspondence/${id}`, { method: 'DELETE' });
  },

  // ── Folders ────────────────────────────────────────────────────────
  async listFolders(): Promise<any[]> {
    const data = await request<{ folders: any[] }>('/api/folders');
    return data.folders;
  },

  async createFolder(folder: any): Promise<any> {
    const data = await request<{ folder: any }>('/api/folders', {
      method: 'POST',
      body: JSON.stringify(folder),
    });
    return data.folder;
  },

  async updateFolder(id: string, folder: any): Promise<any> {
    const data = await request<{ folder: any }>(`/api/folders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(folder),
    });
    return data.folder;
  },

  async deleteFolder(id: string): Promise<void> {
    await request(`/api/folders/${id}`, { method: 'DELETE' });
  },

  // ── Audit log ──────────────────────────────────────────────────────
  async listAudit(): Promise<any[]> {
    const data = await request<{ logs: any[] }>('/api/audit');
    return data.logs;
  },

  async clearAudit(): Promise<void> {
    await request('/api/audit', { method: 'DELETE' });
  },

  // ── CMS ────────────────────────────────────────────────────────────
  async getCms(): Promise<any> {
    const data = await request<{ settings: any }>('/api/cms');
    return data.settings;
  },

  async updateCms(settings: any): Promise<any> {
    const data = await request<{ settings: any }>('/api/cms', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
    return data.settings;
  },

  // ── Uploads ────────────────────────────────────────────────────────
  async upload(files: File[], folder: string = 'misc'): Promise<any[]> {
    const form = new FormData();
    files.forEach((f) => form.append('files', f));
    form.append('folder', folder);
    const data = await request<{ documents: any[] }>('/api/upload', {
      method: 'POST',
      body: form,
    });
    return data.documents;
  },

  async deleteUpload(publicId: string): Promise<void> {
    await request('/api/upload/delete', {
      method: 'POST',
      body: JSON.stringify({ publicId }),
    });
  },
  // Admin: database management (super_admin only)
  async adminStats(): Promise<{ counts: Record<string, number>; database: string }> {
    return await request('/api/admin/db/stats');
  },

  async adminWipe(): Promise<any> {
    return await request('/api/admin/db/wipe', { method: 'POST' });
  },

  async adminReseed(force: boolean = false): Promise<any> {
    const qs = force ? '?force=1' : '';
    return await request('/api/admin/db/reseed' + qs, { method: 'POST' });
  },

  async adminWipeReseed(): Promise<any> {
    return await request('/api/admin/db/wipe-reseed', { method: 'POST' });
  },
};

export default api;
