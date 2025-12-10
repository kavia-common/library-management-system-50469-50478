import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import StaffNav from '../../components/staff/StaffNav';
import { getActivityLog } from '../../services/staff';
import RequirePermission from '../../components/auth/RequirePermission';

// PUBLIC_INTERFACE
export default function ActivityLog() {
  /** Staff activity log page. */
  const { t } = useTranslation();
  const [activity, setActivity] = useState([]);

  useEffect(() => {
    getActivityLog().then(setActivity);
  }, []);

  return (
    <RequirePermission permission="view_reports" fallback={<div className="card" style={{ padding: 16 }}>{t('staff.forbidden')}</div>}>
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        <StaffNav />
        <div style={{ flex: 1, padding: 12 }}>
          <h1 style={{ marginTop: 0 }}>{t('staff.activity.title')}</h1>
          <div className="card" style={{ padding: 12 }}>
            <table role="table" style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: 8 }}>{t('staff.activity.actor')}</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>{t('staff.activity.action')}</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>{t('staff.activity.when')}</th>
                </tr>
              </thead>
              <tbody>
                {activity.map((a) => (
                  <tr key={a.id}>
                    <td style={{ padding: 8 }}>{a.actor}</td>
                    <td style={{ padding: 8 }}>{a.action} {a?.meta?.name ? `— ${a.meta.name}` : ''}</td>
                    <td style={{ padding: 8 }}>{new Date(a.timestamp).toLocaleString()}</td>
                  </tr>
                ))}
                {activity.length === 0 && (
                  <tr><td colSpan={3} style={{ padding: 8, color: 'var(--color-muted)' }}>{t('staff.activity.empty')}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </RequirePermission>
  );
}
