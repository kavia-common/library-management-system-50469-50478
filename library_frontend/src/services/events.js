import { getApiBase } from './api';
import { scheduleNotification } from './notifications'; // optional existing mock, fallback inside
import { awardPoints } from './gamification'; // optional existing mock, fallback inside

// Keys for localStorage
const LS_KEYS = {
  EVENTS: 'events:data',
  RSVPS: 'events:rsvps',
  CHALLENGES: 'events:challenges',
  REMINDERS: 'events:reminders',
  META: 'events:meta',
};

// Utility: safe JSON parse/stringify
function readLS(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}
function writeLS(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota errors in mock
  }
}

// Seed mock data if missing
function seedMockData() {
  const seeded = readLS(LS_KEYS.META, { seededAt: null });
  if (seeded.seededAt) return;

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  // Helper to build date
  function d(y, m, day, hour = 10, minute = 0) {
    return new Date(y, m, day, hour, minute, 0, 0).toISOString();
  }

  const libraries = [
    { id: 'lib-main', name: 'Main Library' },
    { id: 'lib-east', name: 'East Branch' },
  ];

  const categories = ['library', 'book_club', 'workshop', 'challenge'];

  // Basic events pool for current and next two months
  const events = [
    {
      id: 'evt-1',
      title: 'Author Talk: Ocean Journeys',
      category: 'library',
      description:
        'Join us for an inspiring author talk exploring voyages across the oceans. Q&A and book signing to follow.',
      organizer: 'City Library',
      location: { libraryId: 'lib-main', room: 'Auditorium' },
      start: d(year, month, 15, 18, 0),
      end: d(year, month, 15, 19, 30),
      capacity: 120,
      image: null,
    },
    {
      id: 'evt-2',
      title: 'Book Club: The Great Waves',
      category: 'book_club',
      description:
        'Monthly book club meeting discussing "The Great Waves". Snacks provided.',
      organizer: 'Readers Circle',
      location: { libraryId: 'lib-east', room: 'Community Room' },
      start: d(year, month, 20, 17, 30),
      end: d(year, month, 20, 18, 45),
      capacity: 25,
      recurrence: { freq: 'monthly', count: 3 }, // simple mock recurrence
      referencedBookIsbn: '9780000000002',
    },
    {
      id: 'evt-3',
      title: 'Workshop: Research Like a Pro',
      category: 'workshop',
      description:
        'Hands-on workshop covering advanced search techniques and citation tools.',
      organizer: 'Library Staff',
      location: { libraryId: 'lib-main', room: 'Lab A' },
      start: d(year, month + 1, 5, 11, 0),
      end: d(year, month + 1, 5, 12, 30),
      capacity: 16,
    },
    {
      id: 'evt-4',
      title: 'Children Storytime',
      category: 'library',
      description:
        'Storytime session for children aged 3-6. Parents/guardians required.',
      organizer: 'Youth Services',
      location: { libraryId: 'lib-east', room: 'Kids Corner' },
      start: d(year, month + 1, 12, 10, 30),
      end: d(year, month + 1, 12, 11, 15),
      capacity: 30,
    },
  ];

  // Expand recurrence (very simple mock: monthly same day/time)
  const expanded = [];
  events.forEach((evt) => {
    if (evt.recurrence?.freq === 'monthly' && evt.recurrence.count) {
      const s = new Date(evt.start);
      const e = new Date(evt.end);
      for (let i = 0; i < evt.recurrence.count; i++) {
        const start = new Date(s);
        start.setMonth(s.getMonth() + i);
        const end = new Date(e);
        end.setMonth(e.getMonth() + i);
        expanded.push({ ...evt, id: `${evt.id}-r${i}`, start: start.toISOString(), end: end.toISOString(), isRecurrence: true });
      }
    } else {
      expanded.push(evt);
    }
  });

  const challenges = [
    {
      id: 'ch-20-books-2025',
      title: '20 Books in 2025',
      description: 'Read 20 books throughout the year 2025.',
      unit: 'books',
      target: 20,
      start: d(year, 0, 1),
      end: d(year, 11, 31, 23, 59),
      active: true,
      pointsPerMilestone: 50,
    },
    {
      id: 'ch-winter-sprint',
      title: 'Winter Reading Sprint',
      description: 'Read 1000 pages during winter months.',
      unit: 'pages',
      target: 1000,
      start: d(year, 11, 1),
      end: d(year + 1, 1, 28, 23, 59),
      active: true,
      pointsPerMilestone: 30,
    },
  ];

  writeLS(LS_KEYS.EVENTS, expanded);
  writeLS(LS_KEYS.RSVPS, {}); // map of eventId -> 'going'|'interested'|'not_going'
  writeLS(LS_KEYS.CHALLENGES, {
    list: challenges,
    memberships: {}, // userId-> { [challengeId]: { progress: number, joinedAt, leftAt? } }
  });
  writeLS(LS_KEYS.REMINDERS, []);
  writeLS(LS_KEYS.META, { seededAt: new Date().toISOString(), libraries, categories });
}

seedMockData();

// Decide whether to use API or mock
function apiBase() {
  return getApiBase?.() || process.env.REACT_APP_API_BASE || '';
}

async function fetchJson(url, options) {
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...options });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json();
}

// PUBLIC_INTERFACE
export async function getEvents({ from, to, category, libraryId } = {}) {
  /** Get events, filtered by optional date range, category, and library/location. */
  const base = apiBase();
  if (base) {
    const params = new URLSearchParams();
    if (from) params.set('from', new Date(from).toISOString());
    if (to) params.set('to', new Date(to).toISOString());
    if (category) params.set('category', category);
    if (libraryId) params.set('libraryId', libraryId);
    return fetchJson(`${base}/events?${params.toString()}`);
  }
  // Mock
  const events = readLS(LS_KEYS.EVENTS, []);
  return events.filter((e) => {
    const s = new Date(e.start).getTime();
    const inRange =
      (!from || s >= new Date(from).getTime()) &&
      (!to || s <= new Date(to).getTime());
    const catMatch = !category || e.category === category;
    const libMatch = !libraryId || e.location?.libraryId === libraryId;
    return inRange && catMatch && libMatch;
  });
}

// PUBLIC_INTERFACE
export async function getEventById(id) {
  /** Get a single event by ID. */
  const base = apiBase();
  if (base) {
    return fetchJson(`${base}/events/${id}`);
  }
  const events = readLS(LS_KEYS.EVENTS, []);
  return events.find((e) => e.id === id) || null;
}

// PUBLIC_INTERFACE
export async function rsvpEvent(id, status) {
  /** RSVP to an event. Status: 'going' | 'interested' | 'not_going' | null to remove */
  const base = apiBase();
  if (base) {
    return fetchJson(`${base}/events/${id}/rsvp`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    });
  }
  const rsvps = readLS(LS_KEYS.RSVPS, {});
  if (status === null) {
    delete rsvps[id];
  } else {
    rsvps[id] = status;
  }
  writeLS(LS_KEYS.RSVPS, rsvps);

  // Optional gamification: award small points for 'going'
  try {
    const flags = JSON.parse(process.env.REACT_APP_FEATURE_FLAGS || '{}');
    if (flags?.gamification) {
      if (status === 'going') {
        (awardPoints || (() => {}))({ points: 5, reason: 'RSVP Event' });
      }
    }
  } catch {
    // ignore
  }
  return { id, status };
}

// PUBLIC_INTERFACE
export async function getRsvps() {
  /** Get RSVP map for current user (mock: single-user). */
  const base = apiBase();
  if (base) {
    return fetchJson(`${base}/events/rsvps`);
  }
  return readLS(LS_KEYS.RSVPS, {});
}

// PUBLIC_INTERFACE
export function buildIcs(event) {
  /** Generate ICS contents for calendar add. */
  const dt = (iso) => {
    const d = new Date(iso);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
  };
  const uid = `${event.id}@library.mock`;
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Library//Events//EN',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dt(new Date().toISOString())}`,
    `DTSTART:${dt(event.start)}`,
    `DTEND:${dt(event.end)}`,
    `SUMMARY:${(event.title || '').replace(/\n/g, ' ')}`,
    `DESCRIPTION:${(event.description || '').replace(/\n/g, ' ')}`,
    `LOCATION:${(event.location?.room || '')} ${(event.location?.libraryId || '')}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return lines.join('\r\n');
}

// PUBLIC_INTERFACE
export function downloadIcs(event) {
  /** Trigger ICS download for the event. */
  const content = buildIcs(event);
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${event.title || 'event'}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// PUBLIC_INTERFACE
export async function remindMe(eventId, option = '1h') {
  /** Schedule a reminder for an event: '1d' or '1h' before start. */
  const base = apiBase();
  // Regardless of API presence, create a local reminder in mock to keep UI reactive
  const event = await getEventById(eventId);
  if (!event) throw new Error('Event not found');

  let offsetMs = 60 * 60 * 1000;
  if (option === '1d') offsetMs = 24 * 60 * 60 * 1000;
  const startTime = new Date(event.start).getTime();
  const remindAt = new Date(startTime - offsetMs).toISOString();

  const reminders = readLS(LS_KEYS.REMINDERS, []);
  reminders.push({ eventId, remindAt, option });
  writeLS(LS_KEYS.REMINDERS, reminders);

  // Integrate with notifications mock if available
  try {
    (scheduleNotification || (() => {}))({
      id: `reminder-${eventId}-${option}`,
      title: `Reminder: ${event.title}`,
      body: `Starts at ${new Date(event.start).toLocaleString()}`,
      scheduleAt: remindAt,
      data: { type: 'event_reminder', eventId },
    });
  } catch {
    // ignore
  }

  return { eventId, remindAt, option, scheduled: true, viaApi: !!base };
}

// Challenges

function readChallengesState() {
  const state = readLS(LS_KEYS.CHALLENGES, { list: [], memberships: {} });
  return state;
}

function writeChallengesState(state) {
  writeLS(LS_KEYS.CHALLENGES, state);
}

// PUBLIC_INTERFACE
export async function getChallenges() {
  /** Get all challenges and current user's membership/progress. */
  const base = apiBase();
  if (base) {
    return fetchJson(`${base}/challenges`);
  }
  const state = readChallengesState();
  // mock: single user id
  const userId = 'me';
  return {
    list: state.list,
    memberships: state.memberships[userId] || {},
  };
}

// PUBLIC_INTERFACE
export async function joinChallenge(id) {
  /** Join a challenge. */
  const base = apiBase();
  if (base) {
    return fetchJson(`${base}/challenges/${id}/join`, { method: 'POST' });
  }
  const userId = 'me';
  const state = readChallengesState();
  const user = state.memberships[userId] || {};
  if (!user[id]) {
    user[id] = { progress: 0, joinedAt: new Date().toISOString() };
    state.memberships[userId] = user;
    writeChallengesState(state);
    try {
      const flags = JSON.parse(process.env.REACT_APP_FEATURE_FLAGS || '{}');
      if (flags?.gamification) {
        (awardPoints || (() => {}))({ points: 10, reason: 'Joined Challenge' });
      }
    } catch {}
  }
  return { id, progress: user[id].progress };
}

// PUBLIC_INTERFACE
export async function leaveChallenge(id) {
  /** Leave a challenge. */
  const base = apiBase();
  if (base) {
    return fetchJson(`${base}/challenges/${id}/leave`, { method: 'POST' });
  }
  const userId = 'me';
  const state = readChallengesState();
  const user = state.memberships[userId] || {};
  if (user[id]) {
    user[id].leftAt = new Date().toISOString();
    delete user[id];
    state.memberships[userId] = user;
    writeChallengesState(state);
  }
  return { id, left: true };
}

// PUBLIC_INTERFACE
export async function recordChallengeProgress(id, payload) {
  /** Record progress for a challenge: { amount: number } in unit of the challenge (pages/books). */
  const base = apiBase();
  if (base) {
    return fetchJson(`${base}/challenges/${id}/progress`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }
  const { amount } = payload || {};
  const userId = 'me';
  const state = readChallengesState();
  const user = state.memberships[userId] || {};
  if (!user[id]) {
    user[id] = { progress: 0, joinedAt: new Date().toISOString() };
  }
  user[id].progress = Math.max(0, (user[id].progress || 0) + (Number(amount) || 0));
  state.memberships[userId] = user;
  writeChallengesState(state);

  // Milestone: every 25% award points if gamification flag is on
  try {
    const flags = JSON.parse(process.env.REACT_APP_FEATURE_FLAGS || '{}');
    if (flags?.gamification) {
      const list = state.list || [];
      const ch = list.find((c) => c.id === id);
      if (ch && ch.target) {
        const pct = user[id].progress / ch.target;
        if (pct >= 1) {
          (awardPoints || (() => {}))({ points: ch.pointsPerMilestone || 50, reason: 'Completed Challenge' });
        } else if (pct >= 0.75 || pct >= 0.5 || pct >= 0.25) {
          (awardPoints || (() => {}))({ points: 10, reason: 'Challenge Milestone' });
        }
      }
    }
  } catch {}
  return { id, progress: user[id].progress };
}
