import React from 'react';

function BrandIcon() {
  return <div className="brand-badge" aria-hidden>📚</div>;
}

// PUBLIC_INTERFACE
export default function Navbar() {
  /** Top navigation bar with brand */
  return (
    <nav className="navbar" role="navigation" aria-label="Top Navigation">
      <div className="navbar-inner container">
        <div className="brand" aria-label="Library Home">
          <BrandIcon />
          <span>Ocean Library</span>
        </div>
      </div>
    </nav>
  );
}
