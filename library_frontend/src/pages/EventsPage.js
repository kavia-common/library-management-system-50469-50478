import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import EventsCalendar from '../components/events/EventsCalendar';
import EventsList from '../components/events/EventsList';
import EventDetails from '../components/events/EventDetails';
import ChallengesSection from '../components/events/ChallengesSection';
import { downloadIcs, getEvents, getRsvps, remindMe, rsvpEvent } from '../services/events';
import '../components/events/eventDetails.css';

export default function EventsPage() {
  const { t } = useTranslation();
  const [events, setEvents] = useState([]);
  const [rsvps, setRsvps] = useState({});
  const [view, setView] = useState('month');
  const [category, setCategory] = useState('');
  const [libraryId, setLibraryId] = useState('');
  const [selected, setSelected] = useState(null);

  async function refresh() {
    const list = await getEvents({ category: category || undefined, libraryId: libraryId || undefined });
    setEvents(list);
    const map = await getRsvps();
    setRsvps(map);
  }

  useEffect(() => {
    refresh();
  }, [category, libraryId]);

  const categories = useMemo(() => {
    const set = new Set((events || []).map((e) => e.category).filter(Boolean));
    return Array.from(set);
  }, [events]);

  const libraries = useMemo(() => {
    const set = new Set((events || []).map((e) => e.location?.libraryId).filter(Boolean));
    return Array.from(set);
  }, [events]);

  async function onRsvp(status) {
    if (!selected) return;
    await rsvpEvent(selected.id, status);
    const map = await getRsvps();
    setRsvps(map);
  }

  async function onRemind(option) {
    if (!selected) return;
    await remindMe(selected.id, option);
    // Optionally toast
  }

  return (
    <div className="container" style={{ padding: 16 }}>
      <div className="ev-filters" style={{ display:'flex', gap:8, marginBottom: 10 }}>
        <label>
          {t('Categories')}
          <select value={category} onChange={(e)=> setCategory(e.target.value)}>
            <option value="">{t('All')}</option>
            {categories.map((c)=> <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label>
          {t('Location')}
          <select value={libraryId} onChange={(e)=> setLibraryId(e.target.value)}>
            <option value="">{t('All')}</option>
            {libraries.map((l)=> <option key={l} value={l}>{l}</option>)}
          </select>
        </label>
      </div>

      <EventsCalendar
        events={events}
        view={view}
        onViewChange={setView}
        onSelectEvent={setSelected}
      />
      <EventsList events={events} rsvps={rsvps} onSelect={setSelected} />

      <ChallengesSection />

      {selected && (
        <EventDetails
          event={selected}
          rsvp={rsvps[selected.id]}
          onRsvp={onRsvp}
          onAddCalendar={() => downloadIcs(selected)}
          onRemind={onRemind}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
