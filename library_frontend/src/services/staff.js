const API_BASE = process.env.REACT_APP_API_BASE || process.env.REACT_APP_BACKEND_URL || '';

const LS_LIBRARIES = 'staff:libraries';
const LS_USERS = 'staff:users';
const LS_ROLES = 'staff:roles';
const LS_ACTIVITY = 'staff:activity';

const DEFAULT_ROLE_PERMISSIONS = {
  ADMIN: ['manage_libraries', 'manage_staff', 'manage_inventory', 'view_reports'],
  LIBRARIAN: ['manage_inventory', 'view_reports'],
  ASSISTANT: ['view_reports'],
};

function mockMode() {
  return !API_BASE;
}

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}
function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

function seedIfEmpty() {
  if (!read(LS_LIBRARIES, null)) {
    const now = Date.now();
    write(LS_LIBRARIES, [
      { id: 'lib-1', name: 'Downtown Library', address: '123 Ocean Ave', hours: '9:00 - 18:00', createdAt: now },
      { id: 'lib-2', name: 'Harbor Branch', address: '456 Harbor Rd', hours: '10:00 - 17:00', createdAt: now - 1234567 },
      { id: 'lib-3', name: 'Northside Reading Room', address: '789 North St', hours: '8:00 - 16:00', createdAt: now - 2345678 },
    ]);
  }
  if (!read(LS_ROLES, null)) {
    write(LS_ROLES, DEFAULT_ROLE_PERMISSIONS);
  }
  if (!read(LS_USERS, null)) {
    write(LS_USERS, [
      { id: 'u-1', name: 'Alice', email: 'alice@example.com', roles: ['ADMIN'], permissions: DEFAULT_ROLE_PERMISSIONS.ADMIN },
      { id: 'u-2', name: 'Bob', email: 'bob@example.com', roles: ['LIBRARIAN'], permissions: DEFAULT_ROLE_PERMISSIONS.LIBRARIAN },
      { id: 'u-3', name: 'Cara', email: 'cara@example.com', roles: ['ASSISTANT'], permissions: DEFAULT_ROLE_PERMISSIONS.ASSISTANT },
    ]);
  }
  if (!read(LS_ACTIVITY, null)) {
    const now = Date.now();
    write(LS_ACTIVITY, [
      { id: 'a-1', actor: 'Alice', action: 'Created library', meta: { name: 'Downtown Library' }, timestamp: now - 20000 },
      { id: 'a-2', actor: 'Bob', action: 'Updated hours', meta: { name: 'Harbor Branch' }, timestamp: now - 120000 },
      { id: 'a-3', actor: 'Cara', action: 'Viewed report', meta: { name: 'Monthly circulation' }, timestamp: now - 3600000 },
    ]);
  }
}
seedIfEmpty();

async function apiFetch(path, options = {}) {
  const url = `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...options });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `Request failed: ${res.status}`);
  }
  return res.json();
}

// PUBLIC_INTERFACE
export async function getLibraries({ query = '', page = 1, pageSize = 10 } = {}) {
  /** Fetch libraries with optional search/pagination. */
  if (!mockMode()) {
    const params = new URLSearchParams({ q: query, page, pageSize });
    return apiFetch(`/staff/libraries?${params.toString()}`);
  }
  const all = read(LS_LIBRARIES, []);
  const filtered = query
    ? all.filter((l) =>
        [l.name, l.address, l.hours].join(' ').toLowerCase().includes(query.toLowerCase())
      )
    : all;
  const total = filtered.length;
  const start = (page - 1) * pageSize;
  const items = filtered.slice(start, start + pageSize);
  return { items, total, page, pageSize };
}

// PUBLIC_INTERFACE
export async function createLibrary(data) {
  /** Create library; optimistic update in mock. */
  if (!mockMode()) {
    return apiFetch('/staff/libraries', { method: 'POST', body: JSON.stringify(data) });
  }
  const all = read(LS_LIBRARIES, []);
  const item = { id: `lib-${Date.now()}`, ...data, createdAt: Date.now() };
  write(LS_LIBRARIES, [item, ...all]);
  appendActivity({ actor: 'System', action: 'Created library', meta: { name: item.name } });
  return item;
}

// PUBLIC_INTERFACE
export async function updateLibrary(id, data) {
  /** Update library by id; optimistic in mock. */
  if (!mockMode()) {
    return apiFetch(`/staff/libraries/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }
  const all = read(LS_LIBRARIES, []);
  const next = all.map((l) => (l.id === id ? { ...l, ...data } : l));
  write(LS_LIBRARIES, next);
  appendActivity({ actor: 'System', action: 'Updated library', meta: { name: data?.name || id } });
  return next.find((l) => l.id === id);
}

// PUBLIC_INTERFACE
export async function deleteLibrary(id) {
  /** Delete library by id; optimistic in mock. */
  if (!mockMode()) {
    return apiFetch(`/staff/libraries/${id}`, { method: 'DELETE' });
  }
  const all = read(LS_LIBRARIES, []);
  const item = all.find((l) => l.id === id);
  write(LS_LIBRARIES, all.filter((l) => l.id !== id));
  appendActivity({ actor: 'System', action: 'Deleted library', meta: { name: item?.name || id } });
  return { success: true };
}

// PUBLIC_INTERFACE
export async function getStaffUsers() {
  /** List staff users. */
  if (!mockMode()) {
    return apiFetch('/staff/users');
  }
  return read(LS_USERS, []);
}

// PUBLIC_INTERFACE
export async function updateStaffUserRoles(userId, roles) {
  /** Update a staff user's roles and derived permissions. */
  if (!mockMode()) {
    return apiFetch(`/staff/users/${userId}/roles`, { method: 'PUT', body: JSON.stringify({ roles }) });
  }
  const all = read(LS_USERS, []);
  const rp = read(LS_ROLES, DEFAULT_ROLE_PERMISSIONS);
  const permissions = Array.from(new Set([].concat(...roles.map((r) => rp[r] || []))));
  const next = all.map((u) => (u.id === userId ? { ...u, roles, permissions } : u));
  write(LS_USERS, next);
  const updated = next.find((u) => u.id === userId);
  appendActivity({ actor: 'System', action: 'Updated roles', meta: { name: updated?.name, roles: roles.join(', ') } });
  return updated;
}

// PUBLIC_INTERFACE
export async function getRoles() {
  /** Read role-permission map. */
  if (!mockMode()) {
    return apiFetch('/staff/roles');
  }
  return read(LS_ROLES, DEFAULT_ROLE_PERMISSIONS);
}

// PUBLIC_INTERFACE
export async function updateRolePermissions(role, permissions) {
  /** Update a role's permission list. */
  if (!mockMode()) {
    return apiFetch(`/staff/roles/${encodeURIComponent(role)}`, { method: 'PUT', body: JSON.stringify({ permissions }) });
  }
  const rp = read(LS_ROLES, DEFAULT_ROLE_PERMISSIONS);
  const next = { ...rp, [role]: permissions };
  write(LS_ROLES, next);

  // cascade updates to users having this role
  const users = read(LS_USERS, []);
  const updatedUsers = users.map((u) => {
    if (!u.roles.includes(role)) return u;
    const newPerms = Array.from(new Set([].concat(...u.roles.map((r) => next[r] || []))));
    return { ...u, permissions: newPerms };
  });
  write(LS_USERS, updatedUsers);

  appendActivity({ actor: 'System', action: 'Updated role permissions', meta: { role } });
  return next;
}

function appendActivity(entry) {
  const list = read(LS_ACTIVITY, []);
  const item = { id: `a-${Date.now()}`, timestamp: Date.now(), ...entry };
  write(LS_ACTIVITY, [item, ...list].slice(0, 200)); // keep last 200
}

// PUBLIC_INTERFACE
export async function getActivityLog() {
  /** Return recent staff activity. */
  if (!mockMode()) {
    return apiFetch('/staff/activity');
  }
  return read(LS_ACTIVITY, []);
}

export { DEFAULT_ROLE_PERMISSIONS as STAFF_DEFAULT_ROLE_PERMISSIONS };
