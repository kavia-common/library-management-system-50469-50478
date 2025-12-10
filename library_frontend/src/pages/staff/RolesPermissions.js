import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import StaffNav from '../../components/staff/StaffNav';
import { getRoles, updateRolePermissions } from '../../services/staff';
import RequirePermission from '../../components/auth/RequirePermission';

// PUBLIC_INTERFACE
export default function RolesPermissions() {
  /** View and edit role-permission mappings (mock mode only). */
  const { t } = useTranslation();
  const [roles, setRoles] = useState({});
  const [allPerms, setAllPerms] = useState(['manage_libraries', 'manage_staff', 'manage_inventory', 'view_reports']);

  const load = async () => {
    const map = await getRoles();
    setRoles(map);
    const perms = new Set();
    Object.values(map).forEach((list) => (list || []).forEach((p) => perms.add(p)));
    setAllPerms(Array.from(perms).sort());
  };
  useEffect(() => { load(); }, []);

  const toggle = async (role, perm) => {
    const current = roles[role] || [];
    const next = current.includes(perm) ? current.filter((p) => p !== perm) : [...current, perm];
    const updatedMap = await updateRolePermissions(role, next);
    setRoles(updatedMap);
  };

  return (
    <RequirePermission permission="manage_staff" fallback={<div className="card" style={{ padding: 16 }}>{t('staff.forbidden')}</div>}>
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        <StaffNav />
        <div style={{ flex: 1, padding: 12 }}>
          <h1 style={{ marginTop: 0 }}>{t('staff.roles.title')}</h1>
          <div className="card" style={{ padding: 12, overflowX: 'auto' }}>
            <table role="table" style={{ minWidth: 640 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: 8 }}>{t('staff.roles.role')}</th>
                  {allPerms.map((perm) => (
                    <th key={perm} style={{ textAlign: 'center', padding: 8 }}>{perm}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(roles).map(([role, perms]) => (
                  <tr key={role}>
                    <td style={{ padding: 8, fontWeight: 700 }}>{role}</td>
                    {allPerms.map((perm) => (
                      <td key={perm} style={{ padding: 8, textAlign: 'center' }}>
                        <label aria-label={`${t('staff.roles.toggle')} ${role} - ${perm}`}>
                          <input type="checkbox" checked={perms.includes(perm)} onChange={() => toggle(role, perm)} />
                        </label>
                      </td>
                    ))}
                  </tr>
                ))}
                {Object.keys(roles).length === 0 && (
                  <tr><td colSpan={1 + allPerms.length} style={{ padding: 8, color: 'var(--color-muted)' }}>{t('staff.roles.empty')}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </RequirePermission>
  );
}
