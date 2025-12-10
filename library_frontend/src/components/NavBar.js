import React from 'react';
import { useTheme } from '../theme/ThemeContext';
import { useTranslation } from 'react-i18next';
import NotificationsBell from './NotificationsBell';
import { fetchNotifications, getBooks } from '../services/api';
import GamificationSummary from './GamificationSummary';
import { getUserStats, listBadgesCatalog } from '../services/gamification';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { exportReadingListCSV, downloadBlob } from '../services/dataIO';

// PUBLIC_INTERFACE
export default function NavBar() {
  /** Top navigation bar with brand, language switcher, notifications, preferences, theme toggle, and staff entry. */
  const { theme, toggleTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { currentUser, loginAsRole, mock } = useAuth();
  const [unread, setUnread] = React.useState(fetchNotifications().filter(n => !n.read).length);
  const [stats, setStats] = React.useState(null);
  const [nextBadge, setNextBadge] = React.useState(null);

  React.useEffect(() => {
    const sync = () => setUnread(fetchNotifications().filter(n => !n.read).length);
    const id = setInterval(sync, 3000);
    window.addEventListener('storage', sync);
    return () => { clearInterval(id); window.removeEventListener('storage', sync); };
  }, []);

  React.useEffect(() => {
    let active = true;
    getUserStats()
      .then((s) => {
        if (!active) return;
        setStats(s);
        const owned = new Set((s?.badges || []).map((b) => b.id));
        const catalog = listBadgesCatalog();
        setNextBadge(catalog.find((b) => !owned.has(b.id)) || null);
      })
      .catch(() => {});
    const onStorage = (e) => {
      if (e.key === 'gamification:userStats') {
        try {
          const s = JSON.parse(e.newValue || '{}');
          setStats(s);
          const owned = new Set((s?.badges || []).map((b) => b.id));
          const catalog = listBadgesCatalog();
          setNextBadge(catalog.find((b) => !owned.has(b.id)) || null);
        } catch {}
      }
    };
    window.addEventListener('storage', onStorage);
    return () => { active = false; window.removeEventListener('storage', onStorage); };
  }, []);

  const nextMode = theme === 'light' ? 'dark' : 'light';

  const changeLang = (e) => {
    const lng = e.target.value;
    i18n.changeLanguage(lng);
  };

  const showStaffLink = !!(currentUser?.roles || []).length;

  const onExportReadingList = async () => {
    const favoritesRaw = localStorage.getItem('favorites') || '[]';
    let favorites;
    try { favorites = JSON.parse(favoritesRaw); } catch { favorites = []; }
    let books = [];
    try { books = await getBooks(); } catch { books = []; }
    const csv = await exportReadingListCSV({ favorites, allBooks: books });
    downloadBlob('reading_list.csv', csv, 'text/csv;charset=utf-8');
  };

  return (
    <nav
      className="navbar card"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        margin: 0,
        borderRadius: 0,
        padding: '14px 16px',
        background: 'var(--color-surface)',
        borderBottom: '1px solid rgba(17,24,39,0.06)',
      }}
      aria-label="Top navigation"
    >
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            aria-hidden="true"
            style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, rgba(37,99,235,.15), rgba(245,158,11,.15))',
              display: 'grid', placeItems: 'center'
            }}
          >
            <span style={{ color: 'var(--color-primary)' }}>
📚</span>
          </div>
          <div>
            <div style={{ fontWeight: 800, letterSpacing: .2, color: 'var(--color-text)' }}>
              {t('app.name')}
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>
              {t('app.tagline')}
            </div>
          </div>
        </div>

        <div style={{ marginLeft: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
          <Link to="/" className="btn">Home</Link>
          <Link to="/events" className="btn">Events</Link>
          <Link to="/gamification" className="btn">Gamification</Link>
          {showStaffLink ? (<Link to="/staff" className="btn" aria-label={t('staff.nav.title')}>{t('staff.nav.title')}</Link>) : null}
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="btn" onClick={onExportReadingList} aria-label="Export reading list">⬇️ RL</button>

          {stats ? (
            <GamificationSummary
              stats={stats}
              nextBadge={nextBadge}
              onClick={() => navigate('/gamification')}
            />
          ) : null}
          <button
            className="btn"
            onClick={() => navigate('/gamification')}
            aria-label={t('gam.pageTitle')}
            title={t('gam.pageTitle')}
          >
            ✨
          </button>
          <NotificationsBell unreadCount={unread} onClick={() => window.dispatchEvent(new Event('openNotifications'))} ariaControls="notifications-center" />

          {mock && (
            <div className="card" aria-label={t('staff.roleSwitcher')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px' }}>
              <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>{t('staff.role')}</span>
              <button className="btn" onClick={() => loginAsRole('ADMIN')}>ADMIN</button>
              <button className="btn" onClick={() => loginAsRole('LIBRARIAN')}>LIBRARIAN</button>
              <button className="btn" onClick={() => loginAsRole('ASSISTANT')}>ASSISTANT</button>
            </div>
          )}

          <label htmlFor="lang" className="sr-only">{t('nav.language')}</label>
          <select
            id="lang"
            aria-label={t('nav.language')}
            value={i18n.language?.split('-')[0] || 'en'}
            onChange={changeLang}
            className="card"
            style={{ padding: '8px 10px', borderRadius: 8, background: 'var(--color-surface)', border: '1px solid rgba(17,24,39,0.1)' }}
          >
            <option value="en">EN</option>
            <option value="es">ES</option>
          </select>

          <button
            className="btn"
            onClick={() => window.dispatchEvent(new Event('openPreferences'))}
            aria-label={t('notifications.openPreferences')}
            title={t('notifications.openPreferences')}
          >
            ⚙️
          </button>

          <button
            className="btn"
            onClick={toggleTheme}
            aria-label={t('nav.ariaTheme', { mode: nextMode })}
            title={t('nav.toggleTheme')}
          >
            {theme === 'light' ? t('nav.themeDark') : t('nav.themeLight')}
          </button>
        </div>
      </div>
    </nav>
  );
}
