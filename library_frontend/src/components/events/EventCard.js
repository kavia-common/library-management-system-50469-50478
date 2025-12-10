import React from 'react';

export default function EventCard({ event, onClick, rsvpStatus }) {
  const start = new Date(event.start);
  const time = start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return (
    <button className="ev-card" onClick={() => onClick?.(event)}>
      <div className="ev-card-time">
        {start.toLocaleDateString()} • {time}
      </div>
      <div className="ev-card-title">{event.title}</div>
      <div className="ev-card-meta">
        <span className={`ev-cat ev-${event.category}`}>{event.category}</span>
        {event.location?.libraryId && <span className="ev-lib">{event.location.libraryId}</span>}
        {rsvpStatus && <span className={`ev-rsvp ${rsvpStatus}`}>{rsvpStatus}</span>}
      </div>
    </button>
  );
}
