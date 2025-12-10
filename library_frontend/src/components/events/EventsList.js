import React, { useMemo } from 'react';
import EventCard from './EventCard';
import './eventsList.css';

// PUBLIC_INTERFACE
export default function EventsList({ events, rsvps, onSelect }) {
  /** Accessible events list grouped by date. */
  const groups = useMemo(() => {
    const map = new Map();
    (events || []).forEach((e) => {
      const key = new Date(e.start).toDateString();
      if (!map.get(key)) map.set(key, []);
      map.get(key).push(e);
    });
    return Array.from(map.entries()).sort(
      (a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime()
    );
  }, [events]);

  return (
    <div role="list" aria-label="Events" className="evlist">
      {groups.map(([day, list]) => (
        <section key={day} className="evlist-group">
          <h3 className="evlist-date">{new Date(day).toLocaleDateString()}</h3>
          <div className="evlist-items" role="group" aria-label={day}>
            {list.map((e) => (
              <div key={e.id} role="listitem" className="evlist-item">
                <EventCard event={e} rsvpStatus={rsvps?.[e.id]} onClick={onSelect} />
              </div>
            ))}
          </div>
        </section>
      ))}
      {groups.length === 0 && <div className="evlist-empty">No events</div>}
    </div>
  );
}
