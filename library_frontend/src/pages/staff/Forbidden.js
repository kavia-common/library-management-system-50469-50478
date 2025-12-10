import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

// PUBLIC_INTERFACE
export default function Forbidden() {
  /** Shown when access to a staff resource is denied. */
  const { t } = useTranslation();
  return (
    <div style={{ maxWidth: 480, margin: '40px auto', padding: 16 }} className="card">
      <h1 style={{ marginTop: 0 }}>{t('staff.forbiddenTitle')}</h1>
      <p>{t('staff.forbidden')}</p>
      <Link className="btn" to="/">{t('details.back')}</Link>
    </div>
  );
}
