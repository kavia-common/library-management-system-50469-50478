import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getProfile } from '../services/user';

function BrandIcon() {
  return <div className="brand-badge" aria-hidden>📚</div>;
}

function MiniAvatar({ size = 28, profile }) {
  const style = {
    width: size,
    height: size,
    borderRadius: 999,
    display: 'grid',
    placeItems: 'center',
    background: 'linear-gradient(135deg, var(--color-primary), #60A5FA)',
    color: 'white',
    fontWeight: 800,
    overflow: 'hidden',
  };
  const initials = (profile?.initials || 'U').slice(0, 2).toUpperCase();
  if (profile?.avatarUrl && String(profile.avatarUrl).trim()) {
    return <img src={profile.avatarUrl} alt="User avatar" width={size} height={size} style={{ ...style, objectFit: 'cover' }} />;
  }
  return <div style={style} aria-hidden>{initials}</div>;
}

// PUBLIC_INTERFACE
export default function Navbar() {
  /** Top navigation bar with brand, Dashboard, Manage Books, and Profile link */
  const [profile, setProfile] = useState(null);
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const p = await getProfile();
        if (alive) setProfile(p);
      } catch { /* ignore */ }
    })();
    return () => { alive = false; };
  }, []);

  return (
    <nav className="navbar" role="navigation" aria-label="Top Navigation">
      <div className="navbar-inner container" style={{ justifyContent: 'space-between' }}>
        <Link to="/" className="brand" aria-label="Library Home">
          <BrandIcon />
          <span>Ocean Library</span>
        </Link>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Link to="/dashboard" className="btn" aria-label="Go to Dashboard" style={{ textDecoration: 'none', background: 'var(--color-muted)', color: 'var(--color-text)' }}>
            Dashboard
          </Link>
          <Link to="/manage" className="btn" aria-label="Go to Manage Books" style={{ textDecoration: 'none' }}>
            Manage Books
          </Link>
          <Link to="/profile" aria-label="Go to Profile" title="Profile" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <MiniAvatar profile={profile} />
            <span style={{ fontSize: 13, color: 'var(--color-text)' }}>{profile?.displayName || 'Profile'}</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
