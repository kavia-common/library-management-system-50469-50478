import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';

// PUBLIC_INTERFACE
export default function StaffLogin() {
  /** Simple mock login to select a role and enter staff area. */
  const { t } = useTranslation();
  const { loginAsRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/staff';

  const choose = (role) => {
    loginAsRole(role);
    navigate(from, { replace: true });
  };

  return (
    <div style={{ maxWidth: 480, margin: '40px auto', padding: 16 }} className="card">
      <h1 style={{ marginTop: 0 }}>{t('staff.login.title')}</h1>
      <p>{t('staff.login.subtitle')}</p>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn" onClick={() => choose('ADMIN')}>ADMIN</button>
        <button className="btn" onClick={() => choose('LIBRARIAN')}>LIBRARIAN</button>
        <button className="btn" onClick={() => choose('ASSISTANT')}>ASSISTANT</button>
      </div>
      <p style={{ color: 'var(--color-muted)', marginTop: 12 }}>{t('staff.login.note')}</p>
    </div>
  );
}
