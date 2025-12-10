import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import './events.css';

// Utility for dates
function startOfMonth(d) {
  const nd = new Date(d);
  nd.setDate(1); nd.setHours(0,0,0,0);
  return nd;
}
function endOfMonth(d) {
  const nd = new Date(d);
  nd.setMonth(nd.getMonth() + 1);
  nd.setDate(0); nd.setHours(23,59,59,999);
  return nd;
}
function addDays(d, n) {
  const nd = new Date(d);
  nd.setDate(nd.getDate() + n);
  return nd;
}
function startOfWeek(d) {
  const nd = new Date(d);
  const day = nd.getDay(); // 0 Sun - 6 Sat
  return addDays(new Date(nd.getFullYear(), nd.getMonth(), nd.getDate(), 0,0,0,0), -day);
}
function endOfWeek(d) {
  return addDays(startOfWeek(d), 6);
}
function formatDayLabel(d) {
  return `${d.getDate()}`;
}

function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

// PUBLIC_INTERFACE
export default function EventsCalendar({ events, view = 'month', onViewChange, onSelectEvent }) {
  /** Accessible calendar grid for events with month/week/list toggles. */
  const { t } = useTranslation();
  const [cursor, setCursor] = useState(new Date());
  const gridRef = useRef(null);

  useEffect(() => {
    // focus grid for keyboard users
    if (gridRef.current) {
      gridRef.current.focus();
    }
  }, [view]);

  const days = useMemo(() => {
    if (view === 'week') {
      const start = startOfWeek(cursor);
      return Array.from({ length: 7 }, (_, i) => addDays(start, i));
    }
    // month view
    const start = startOfWeek(startOfMonth(cursor));
    const end = endOfWeek(endOfMonth(cursor));
    const res = [];
    for (let d = new Date(start); d <= end; d = addDays(d, 1)) {
      res.push(new Date(d));
    }
    return res;
  }, [cursor, view]);

  const grouped = useMemo(() => {
    const map = new Map();
    (events || []).forEach((e) => {
      const key = new Date(e.start).toDateString();
      if (!map.get(key)) map.set(key, []);
      map.get(key).push(e);
    });
    return map;
  }, [events]);

  function onKeyDown(e) {
    const key = e.key;
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(key)) {
      e.preventDefault();
    }
    if (key === 'ArrowLeft') setCursor(addDays(cursor, -1));
    if (key === 'ArrowRight') setCursor(addDays(cursor, 1));
    if (key === 'ArrowUp') setCursor(addDays(cursor, -7));
    if (key === 'ArrowDown') setCursor(addDays(cursor, 7));
    if (key === 'PageUp') setCursor(addDays(cursor, view === 'week' ? -7 : -30));
    if (key === 'PageDown') setCursor(addDays(cursor, view === 'week' ? 7 : 30));
  }

  function renderCell(day) {
    const today = new Date();
    const key = day.toDateString();
    const list = grouped.get(key) || [];
    const isToday = sameDay(today, day);
    const inMonth = day.getMonth() === cursor.getMonth();

    return (
      <div
        key={key}
        role="gridcell"
        aria-selected={sameDay(cursor, day)}
        tabIndex={0}
        className={`evc-cell ${inMonth ? '' : 'muted'} ${isToday ? 'today' : ''}`}
        onClick={() => setCursor(day)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && list.length > 0) {
            onSelectEvent?.(list[0]);
          }
        }}
      >
        <div className="evc-date">{formatDayLabel(day)}</div>
        <div className="evc-events">
          {list.slice(0,3).map((e) => (
            <button
              key={e.id}
              className="evc-pill"
              onClick={(ev) => { ev.stopPropagation(); onSelectEvent?.(e); }}
            >
              {e.title}
            </button>
          ))}
          {list.length > 3 && <div className="evc-more">+{list.length - 3}</div>}
        </div>
      </div>
    );
  }

  function headerLabel() {
    const months = t('monthNames', { returnObjects: true }) || [];
    return `${months[cursor.getMonth()] || ''} ${cursor.getFullYear()}`;
  }

  return (
    <div className="evc-wrap">
      <div className="evc-toolbar">
        <div className="evc-title">{t('Events')}</div>
        <div className="evc-range">{headerLabel()}</div>
        <div className="evc-views">
          <button
            className={`evc-btn ${view === 'month' ? 'active' : ''}`}
            onClick={() => onViewChange?.('month')}
          >{t('Calendar')}</button>
          <button
            className={`evc-btn ${view === 'week' ? 'active' : ''}`}
            onClick={() => onViewChange?.('week')}
          >{t('Week')}</button>
          <button
            className={`evc-btn ${view === 'list' ? 'active' : ''}`}
            onClick={() => onViewChange?.('list')}
          >{t('List')}</button>
        </div>
      </div>

      {view !== 'list' ? (
        <div
          ref={gridRef}
          role="grid"
          aria-label={t('Calendar')}
          tabIndex={0}
          onKeyDown={onKeyDown}
          className="evc-grid"
        >
          {days.map(renderCell)}
        </div>
      ) : (
        <div className="evc-list-info">{t('List')}</div>
      )}
    </div>
  );
}
