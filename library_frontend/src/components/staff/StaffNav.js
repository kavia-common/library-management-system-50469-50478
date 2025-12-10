import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function StaffNav() {
  const { t } = useTranslation();
  const linkStyle = ({ isActive }) => ({
    display: 'block',
    padding: '10px 12px',
    borderRadius: 8,
    color: isActive ? 'var(--color-primary)' : 'var(--color-text)',
    background: isActive ? 'rgba(37,99,235,0.08)' : 'transparent',
    textDecoration: 'none',
    fontWeight: isActive ? 700 : 500,
    transition: 'background .2s ease',
  });

  return (
    <nav aria-label={t('staff.nav.aria')} style={{ minWidth: 220, padding: 12 }}>
      <div className="card" style={{ padding: 12 }}>
        <div style={{ fontWeight: 800, marginBottom: 8 }}>{t('staff.nav.title')}</div>
        <NavLink to="/staff" style={linkStyle} end>{t('staff.nav.dashboard')}</NavLink>
        <NavLink to="/staff/libraries" style={linkStyle}>{t('staff.nav.libraries')}</NavLink>
        <NavLink to="/staff/users" style={linkStyle}>{t('staff.nav.users')}</NavLink>
        <NavLink to="/staff/roles" style={linkStyle}>{t('staff.nav.roles')}</NavLink>
        <NavLink to="/staff/activity" style={linkStyle}>{t('staff.nav.activity')}</NavLink>
        <NavLink to="/staff/taxonomy" style={linkStyle}>Taxonomy</NavLink>
      </div>
    </nav>
  );
}
