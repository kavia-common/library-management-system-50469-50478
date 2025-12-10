import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import StaffNav from '../../components/staff/StaffNav';
import { getActivityLog, getLibraries, getStaffUsers } from '../../services/staff';
import { Link } from 'react-router-dom';

// PUBLIC_INTERFACE
export default function StaffDashboard() {
  /** Staff landing overview with quick links and recent activity. */
  const { t } = useTranslation();
  const [librariesCount, setLibrariesCount] = useState(0);
  const [staffCount, setStaffCount] = useState(0);
  const [activity, setActivity] = useState([]);

  useEffect(() => {
    getLibraries({ pageSize: 1 }).then((res) => setLibrariesCount(res.total));
    getStaffUsers().then((users) => setStaffCount(users.length));
    getActivityLog().then(setActivity);
  }, []);

  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
      <StaffNav />
      <div style={{ flex: 1, padding: 12 }}>
        <h1 style={{ marginTop: 0 }}>{t('staff.dashboard.title')}</h1>

        <section aria-label={t('staff.dashboard.overview')}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            <div className="card" role="status" aria-live="polite" style={{ padding: 16 }}>
              <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>{t('staff.dashboard.cards.libraries')}</div>
              <div style={{ fontWeight: 800, fontSize: 28 }}>{librariesCount}</div>
            </div>
            <div className="card" role="status" aria-live="polite" style={{ padding: 16 }}>
              <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>{t('staff.dashboard.cards.staff')}</div>
              <div style={{ fontWeight: 800, fontSize: 28 }}>{staffCount}</div>
            </div>
            <div className="card" role="status" aria-live="polite" style={{ padding: 16 }}>
              <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>{t('staff.dashboard.cards.pending')}</div>
              <div style={{ fontWeight: 800, fontSize: 28 }}>0</div>
            </div>
          </div>
        </section>

        <section aria-label={t('staff.dashboard.quickLinks')} style={{ marginTop: 16 }}>
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>{t('staff.dashboard.quickLinks')}</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Link to="/staff/libraries" className="btn">{t('staff.nav.libraries')}</Link>
              <Link to="/staff/users" className="btn">{t('staff.nav.users')}</Link>
              <Link to="/staff/roles" className="btn">{t('staff.nav.roles')}</Link>
              <Link to="/staff/activity" className="btn">{t('staff.nav.activity')}</Link>
            </div>
          </div>
        </section>

        <section aria-label={t('staff.activity.title')} style={{ marginTop: 16 }}>
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>{t('staff.activity.title')}</div>
            <table role="table" style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: 8 }}>{t('staff.activity.actor')}</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>{t('staff.activity.action')}</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>{t('staff.activity.when')}</th>
                </tr>
              </thead>
              <tbody>
                {activity.slice(0, 10).map((a) => (
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
        </section>
      </div>
    </div>
  );
}
