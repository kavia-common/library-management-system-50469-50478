import React from 'react';
import { useTheme } from '../theme/ThemeContext';
import { useTranslation } from 'react-i18next';
import NotificationsBell from './NotificationsBell';
import { fetchNotifications } from '../services/api';
import OfflineIndicator from './OfflineIndicator';
import { useToast } from './ToastContext';

// PUBLIC_INTERFACE
export default function NavBar() {
  /** Top navigation bar with brand, language switcher, notifications, preferences, theme toggle, and offline indicator. */
  const { theme, toggleTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const { showToast } = useToast();
  const [unread, setUnread] = React.useState(fetchNotifications().filter(n => !n.read).length);

  React.useEffect(() => {
    const sync = () => setUnread(fetchNotifications().filter(n => !n.read).length);
    const id = setInterval(sync, 3000);
    window.addEventListener('storage', sync);
    return () => { clearInterval(id); window.removeEventListener('storage', sync); };
  }, []);

  // SW update toasts
  React.useEffect(() => {
    const onUpdate = () => {
      showToast(t('offline.updateAvailable'));
      // Optionally prompt reload; here we listen for click on toast isn't available,
      // but user can manually reload to activate new version.
      if (navigator.serviceWorker?.controller) {
        navigator.serviceWorker.getRegistration().then((reg) => {
          reg?.waiting?.postMessage?.({ type: 'SKIP_WAITING' });
        });
      }
    };
    const onUpdated = () => {
      showToast(t('offline.updated'));
    };
    window.addEventListener('sw:update-available', onUpdate);
    window.addEventListener('sw:updated', onUpdated);
    return () => {
      window.removeEventListener('sw:update-available', onUpdate);
      window.removeEventListener('sw:updated', onUpdated);
    };
  }, [showToast, t]);

  // Online/offline toasts
  React.useEffect(() => {
    const onOnline = () => showToast(t('offline.onlineToast'));
    const onOffline = () => showToast(t('offline.offlineToast'));
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, [showToast, t]);

  const nextMode = theme === 'light' ? 'dark' : 'light';

  const changeLang = (e) => {
    const lng = e.target.value;
    i18n.changeLanguage(lng);
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
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            aria-hidden="true"
            style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, rgba(37,99,235,.15), rgba(245,158,11,.15))',
              display: 'grid', placeItems: 'center'
            }}
          >
            <span style={{ color: 'var(--color-primary)' }}>📚</span>
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
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          <OfflineIndicator />
          <NotificationsBell unreadCount={unread} onClick={() => window.dispatchEvent(new Event('openNotifications'))} ariaControls="notifications-center" />

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
