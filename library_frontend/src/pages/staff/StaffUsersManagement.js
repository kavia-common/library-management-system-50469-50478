import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import StaffNav from '../../components/staff/StaffNav';
import { getRoles, getStaffUsers, updateStaffUserRoles } from '../../services/staff';
import RequirePermission from '../../components/auth/RequirePermission';

function EditRolesModal({ open, onClose, user, roleNames, onSave }) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState(user?.roles || []);
  useEffect(() => { if (open) setSelected(user?.roles || []); }, [open, user]);
  if (!open) return null;

  const toggle = (role) => {
    setSelected((prev) => prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]);
  };

  const submit = (e) => {
    e.preventDefault();
    onSave(selected);
  };

  return (
    <div role="dialog" aria-modal="true" aria-label={t('staff.users.editRoles')} className="card"
         style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.2)', display: 'grid', placeItems: 'center' }}>
      <form onSubmit={submit} className="card" style={{ background: 'var(--color-surface)', padding: 16, minWidth: 320 }}>
        <h2 style={{ marginTop: 0 }}>{t('staff.users.editRolesFor', { name: user?.name })}</h2>
        <div role="group" aria-label={t('staff.users.roles')}>
          {roleNames.map((role) => (
            <label key={role} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '6px 0' }}>
              <input type="checkbox" checked={selected.includes(role)} onChange={() => toggle(role)} />
              <span>{role}</span>
            </label>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
          <button type="button" className="btn" onClick={onClose}>{t('notifications.actions.cancel')}</button>
          <button type="submit" className="btn">{t('notifications.actions.save')}</button>
        </div>
      </form>
    </div>
  );
}

// PUBLIC_INTERFACE
export default function StaffUsersManagement() {
  /** Manage staff users, roles, and permissions. */
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState({});
  const [editingUser, setEditingUser] = useState(null);

  const roleNames = Object.keys(roles);

  const load = async () => {
    const [u, r] = await Promise.all([getStaffUsers(), getRoles()]);
    setUsers(u); setRoles(r);
  };
  useEffect(() => { load(); }, []);

  const onSaveRoles = async (rolesList) => {
    if (!editingUser) return;
    await updateStaffUserRoles(editingUser.id, rolesList);
    setEditingUser(null);
    await load();
  };

  return (
    <RequirePermission permission="manage_staff" fallback={<div className="card" style={{ padding: 16 }}>{t('staff.forbidden')}</div>}>
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        <StaffNav />
        <div style={{ flex: 1, padding: 12 }}>
          <h1 style={{ marginTop: 0 }}>{t('staff.users.title')}</h1>
          <div className="card" style={{ padding: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 700 }}>{t('staff.users.list')}</div>
              <button className="btn" title={t('staff.users.invite')} aria-label={t('staff.users.invite')} onClick={() => alert(t('staff.users.invitePlaceholder'))}>
                {t('staff.users.invite')}
              </button>
            </div>
            <table role="table" style={{ width: '100%', marginTop: 8 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: 8 }}>{t('staff.users.name')}</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>{t('staff.users.email')}</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>{t('staff.users.roles')}</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>{t('staff.users.permissions')}</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>{t('staff.users.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td style={{ padding: 8 }}>{u.name}</td>
                    <td style={{ padding: 8 }}>{u.email}</td>
                    <td style={{ padding: 8 }}>{(u.roles || []).join(', ')}</td>
                    <td style={{ padding: 8 }}>{(u.permissions || []).join(', ')}</td>
                    <td style={{ padding: 8 }}>
                      <button className="btn" onClick={() => setEditingUser(u)} aria-label={t('staff.users.editRolesFor', { name: u.name })}>{t('common.edit') || 'Edit'}</button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr><td colSpan={5} style={{ padding: 8, color: 'var(--color-muted)' }}>{t('staff.users.empty')}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <EditRolesModal open={!!editingUser} onClose={() => setEditingUser(null)} user={editingUser} roleNames={roleNames} onSave={onSaveRoles} />
    </RequirePermission>
  );
}
