import React from 'react';
import { useTranslation } from 'react-i18next';

export default function EventDetails({ event, rsvp, onRsvp, onAddCalendar, onRemind, onClose }) {
  const { t } = useTranslation();
  if (!event) return null;

  const seatsLeft = typeof event.capacity === 'number' ? Math.max(0, event.capacity - 0) : null; // mock no attendance count
  const start = new Date(event.start);
  const end = new Date(event.end);

  return (
    <div role="dialog" aria-modal="true" className="evd-modal">
      <div className="evd-card">
        <div className="evd-head">
          <h2 className="evd-title">{event.title}</h2>
          <button className="evd-close" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="evd-body">
          <div className="evd-time">
            {start.toLocaleString()} — {end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div className="evd-desc">{event.description}</div>
          <div className="evd-meta">
            {event.organizer && <div><strong>{t('Organizer')}:</strong> {event.organizer}</div>}
            {event.location?.libraryId && <div><strong>{t('Location')}:</strong> {event.location.libraryId}{event.location.room ? ` • ${event.location.room}` : ''}</div>}
            {typeof event.capacity === 'number' && <div><strong>{t('Capacity')}:</strong> {event.capacity} {seatsLeft !== null && <em>({t('Seats left')}: {seatsLeft})</em>}</div>}
          </div>
        </div>
        <div className="evd-actions">
          <div className="evd-rsvp">
            <span>{t('RSVP')}:</span>
            <button className={`evd-btn ${rsvp === 'going' ? 'active' : ''}`} onClick={() => onRsvp('going')}>{t('Going')}</button>
            <button className={`evd-btn ${rsvp === 'interested' ? 'active' : ''}`} onClick={() => onRsvp('interested')}>{t('Interested')}</button>
            <button className={`evd-btn ${rsvp === 'not_going' ? 'active' : ''}`} onClick={() => onRsvp('not_going')}>{t('Not going')}</button>
          </div>
          <div className="evd-more">
            <button className="evd-link" onClick={onAddCalendar}>{t('Add to calendar')}</button>
            <button className="evd-link" onClick={() => onRemind('1h')}>{t('Remind me')} (1h)</button>
            <button className="evd-link" onClick={() => onRemind('1d')}>{t('Remind me')} (1d)</button>
          </div>
        </div>
      </div>
    </div>
  );
}
