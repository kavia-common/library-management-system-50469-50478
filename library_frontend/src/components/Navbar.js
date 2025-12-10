import React from 'react';
import { Link } from 'react-router-dom';

function BrandIcon() {
  return <div className="brand-badge" aria-hidden>📚</div>;
}

// PUBLIC_INTERFACE
export default function Navbar() {
  /** Top navigation bar with brand, Dashboard, and Manage Books links */
  return (
    <nav className="navbar" role="navigation" aria-label="Top Navigation">
      <div className="navbar-inner container" style={{ justifyContent: 'space-between' }}>
        <Link to="/" className="brand" aria-label="Library Home">
          <BrandIcon />
          <span>Ocean Library</span>
        </Link>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link to="/dashboard" className="btn" aria-label="Go to Dashboard" style={{ textDecoration: 'none', background: 'var(--color-muted)', color: 'var(--color-text)' }}>
            Dashboard
          </Link>
          <Link to="/manage" className="btn" aria-label="Go to Manage Books" style={{ textDecoration: 'none' }}>
            Manage Books
          </Link>
        </div>
      </div>
    </nav>
  );
}
