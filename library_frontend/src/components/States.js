import React from 'react';

// PUBLIC_INTERFACE
export function EmptyState({ message = 'No results found.' }) {
  return <div className="empty" role="status">{message}</div>;
}

// PUBLIC_INTERFACE
export function LoadingSkeleton({ count = 8 }) {
  return (
    <div className="grid" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card">
          <div className="card-media skeleton" />
          <div className="card-body">
            <div className="skeleton" style={{ height: 16, width: '70%', borderRadius: 6, marginBottom: 8 }} />
            <div className="skeleton" style={{ height: 12, width: '40%', borderRadius: 6 }} />
            <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
              <div className="skeleton" style={{ height: 20, width: 60, borderRadius: 999 }} />
              <div className="skeleton" style={{ height: 20, width: 60, borderRadius: 999 }} />
            </div>
          </div>
          <div className="card-actions">
            <div className="skeleton" style={{ height: 28, width: 100, borderRadius: 8 }} />
            <div className="skeleton" style={{ height: 32, width: 80, borderRadius: 10 }} />
          </div>
        </div>
      ))}
    </div>
  );
}
