const envBase =
  process.env.REACT_APP_API_BASE ||
  process.env.REACT_APP_BACKEND_URL ||
  '';

/**
 * PUBLIC_INTERFACE
 * Resolve API base from env; default to relative "/api" if not set.
 */
const API_BASE = envBase || '/api';

// Utility: localStorage read/write
function readStorage(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}
function writeStorage(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

// Minimal user identity persisted for leaderboard usage
const UID_KEY = 'gamification:userId';
// PUBLIC_INTERFACE
export function getOrCreateUserId() {
  /** Return a stable pseudo-UUID for this browser from localStorage. */
  let id = readStorage(UID_KEY, null);
  if (!id) {
    id = `u_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
    writeStorage(UID_KEY, id);
  }
  return id;
}

// API helper
async function apiFetch(path, options = {}) {
  const url = `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...options });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `Request failed: ${res.status}`);
  }
  return res.json();
}

// Keys for mock storage
const STATS_KEY = 'gamification:userStats';
const LB_KEY = 'gamification:leaderboard';

// Seed initial stats if empty
function defaultStats() {
  return {
    userId: getOrCreateUserId(),
    displayName: 'You',
    points: 0,
    pagesRead: 0,
    minutesRead: 0,
    currentStreak: 0,
    bestStreak: 0,
    lastReadDate: null, // ISO date string 'YYYY-MM-DD'
    badges: [], // [{id, name, description, earnedAt}]
    progress: {
      pages100: 0,
      earlyBirdDays: 0,
      nightOwlDays: 0
    }
  };
}

// Badge catalogue
const BADGES = {
  first_read: { id: 'first_read', nameKey: 'gam.badges.firstRead.name', descKey: 'gam.badges.firstRead.desc', emoji: '📖' },
  streak_7: { id: 'streak_7', nameKey: 'gam.badges.streak7.name', descKey: 'gam.badges.streak7.desc', emoji: '🔥' },
  streak_30: { id: 'streak_30', nameKey: 'gam.badges.streak30.name', descKey: 'gam.badges.streak30.desc', emoji: '🏆' },
  pages_100: { id: 'pages_100', nameKey: 'gam.badges.pages100.name', descKey: 'gam.badges.pages100.desc', emoji: '📚' },
  early_bird: { id: 'early_bird', nameKey: 'gam.badges.earlyBird.name', descKey: 'gam.badges.earlyBird.desc', emoji: '🌅' },
  night_owl: { id: 'night_owl', nameKey: 'gam.badges.nightOwl.name', descKey: 'gam.badges.nightOwl.desc', emoji: '🌙' }
};

function isoDateFromTs(ts) {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
function daysBetweenISO(a, b) {
  const da = new Date(a + 'T00:00:00Z').getTime();
  const db = new Date(b + 'T00:00:00Z').getTime();
  return Math.round((db - da) / (24 * 60 * 60 * 1000));
}

// Mock leaderboard seed
function readOrSeedLeaderboard() {
  const existing = readStorage(LB_KEY, null);
  if (existing) return existing;
  const sample = [
    { userId: 'u_alpha', displayName: 'Avery', points: 820, currentStreak: 12, pagesRead: 1240 },
    { userId: 'u_bravo', displayName: 'Blake', points: 610, currentStreak: 5, pagesRead: 820 },
    { userId: 'u_charlie', displayName: 'Casey', points: 520, currentStreak: 7, pagesRead: 690 }
  ];
  writeStorage(LB_KEY, sample);
  return sample;
}
readOrSeedLeaderboard();

// PUBLIC_INTERFACE
export async function getUserStats() {
  /**
   * Get user gamification stats. If backend is configured, calls:
   * GET /gamification/stats -> { points, currentStreak, bestStreak, lastReadDate, badges: [...], progress: {...}, pagesRead, minutesRead }
   * Otherwise uses mock localStorage.
   */
  try {
    const data = await apiFetch('/gamification/stats');
    return data;
  } catch {
    const stats = readStorage(STATS_KEY, null) || defaultStats();
    writeStorage(STATS_KEY, stats);
    return stats;
  }
}

// PUBLIC_INTERFACE
export async function recordReadingActivity({ pages = 0, minutes = 0, timestamp = Date.now() }) {
  /**
   * Record reading activity. Backend contract:
   * POST /gamification/activity { pages, minutes, timestamp? } -> updated stats
   * Mock: updates localStorage, points, streak, badges, and leaderboard.
   */
  try {
    const data = await apiFetch('/gamification/activity', {
      method: 'POST',
      body: JSON.stringify({ pages, minutes, timestamp })
    });
    return data;
  } catch {
    const now = timestamp || Date.now();
    const todayIso = isoDateFromTs(now);
    const hour = new Date(now).getHours();

    const current = readStorage(STATS_KEY, null) || defaultStats();

    // Update totals
    current.pagesRead = Math.max(0, (current.pagesRead || 0) + Number(pages || 0));
    current.minutesRead = Math.max(0, (current.minutesRead || 0) + Number(minutes || 0));
    // Simple points: 1 point per minute + 0.5 per page
    current.points = Math.round((current.points || 0) + (minutes || 0) + 0.5 * (pages || 0));

    // Streak logic
    if (!current.lastReadDate) {
      current.currentStreak = 1;
    } else {
      const diff = daysBetweenISO(current.lastReadDate, todayIso);
      if (diff === 0) {
        // same day, streak unchanged
      } else if (diff === 1) {
        current.currentStreak = (current.currentStreak || 0) + 1;
      } else if (diff > 1) {
        current.currentStreak = 1;
      }
    }
    current.bestStreak = Math.max(current.bestStreak || 0, current.currentStreak || 0);
    current.lastReadDate = todayIso;

    // Progress tracking
    current.progress = current.progress || { pages100: 0, earlyBirdDays: 0, nightOwlDays: 0 };
    const beforePagesProgress = current.progress.pages100 || 0;
    current.progress.pages100 = Math.min(100, Math.round(((current.pagesRead || 0) / 100) * 100));

    // Early bird (5-8AM) or Night owl (10PM-2AM) day counters
    let awardedEarly = false;
    let awardedNight = false;
    if (hour >= 5 && hour < 8) {
      awardedEarly = true;
    }
    if (hour >= 22 || hour < 2) {
      awardedNight = true;
    }
    const dayKey = `gamification:dayMarkers:${todayIso}`;
    const dayMarkers = readStorage(dayKey, { early: false, night: false });
    if (awardedEarly && !dayMarkers.early) {
      current.progress.earlyBirdDays = (current.progress.earlyBirdDays || 0) + 1;
      dayMarkers.early = true;
      writeStorage(dayKey, dayMarkers);
    }
    if (awardedNight && !dayMarkers.night) {
      current.progress.nightOwlDays = (current.progress.nightOwlDays || 0) + 1;
      dayMarkers.night = true;
      writeStorage(dayKey, dayMarkers);
    }

    // Badge awarding
    const earned = new Set((current.badges || []).map((b) => b.id));
    const newBadges = [];

    const award = (badgeId) => {
      if (!earned.has(badgeId)) {
        const meta = BADGES[badgeId];
        const badge = {
          id: badgeId,
          nameKey: meta.nameKey,
          descKey: meta.descKey,
          emoji: meta.emoji,
          earnedAt: new Date(now).toISOString()
        };
        current.badges = [...(current.badges || []), badge];
        newBadges.push(badge);
        earned.add(badgeId);
      }
    };

    if ((minutes > 0 || pages > 0) && !earned.has('first_read')) award('first_read');
    if ((current.currentStreak || 0) >= 7) award('streak_7');
    if ((current.currentStreak || 0) >= 30) award('streak_30');
    if (beforePagesProgress < 100 && current.progress.pages100 >= 100) award('pages_100');

    if ((current.progress.earlyBirdDays || 0) >= 3) award('early_bird');
    if ((current.progress.nightOwlDays || 0) >= 3) award('night_owl');

    writeStorage(STATS_KEY, current);

    // Update leaderboard mock
    const lb = readStorage(LB_KEY, []) || [];
    const uid = current.userId || getOrCreateUserId();
    const displayName = current.displayName || 'You';
    const idx = lb.findIndex((u) => u.userId === uid);
    const myRow = {
      userId: uid,
      displayName,
      points: current.points || 0,
      currentStreak: current.currentStreak || 0,
      pagesRead: current.pagesRead || 0
    };
    if (idx >= 0) lb[idx] = myRow;
    else lb.push(myRow);
    writeStorage(LB_KEY, lb);

    try {
      const SE = typeof StorageEvent !== 'undefined' ? StorageEvent : null;
      if (SE) {
        window.dispatchEvent(new SE('storage', { key: STATS_KEY, newValue: JSON.stringify(current) }));
        window.dispatchEvent(new SE('storage', { key: LB_KEY, newValue: JSON.stringify(lb) }));
      } else {
        window.dispatchEvent(new Event('storage'));
      }
    } catch {}

    return { ...current, _newBadges: newBadges };
  }
}

// PUBLIC_INTERFACE
export async function getLeaderboard({ period = 'all' } = {}) {
  /**
   * Fetch leaderboard. Backend:
   * GET /gamification/leaderboard?period=weekly|monthly|all
   * Mock: compute ranks from stored list and simple filters.
   */
  try {
    const data = await apiFetch(`/gamification/leaderboard?period=${encodeURIComponent(period)}`);
    return data;
  } catch {
    const lb = readStorage(LB_KEY, []) || [];
    let list = [...lb];
    if (period === 'weekly') {
      list = list.map((u) => ({ ...u, points: Math.round(u.points * 0.25) }));
    } else if (period === 'monthly') {
      list = list.map((u) => ({ ...u, points: Math.round(u.points * 0.6) }));
    }
    list.sort((a, b) => (b.points || 0) - (a.points || 0));
    return list.map((u, i) => ({ rank: i + 1, ...u }));
  }
}

// PUBLIC_INTERFACE
export function listBadgesCatalog() {
  /** Return static badge catalog metadata. */
  return Object.values(BADGES);
}

// PUBLIC_INTERFACE
export function awardPoints({ points, reason }) {
  /** Mock points award; replace with backend integration if available. */
  try { 
    // eslint-disable-next-line no-console
    console.log('[Gamification] +%d points for %s', points, reason); 
  } catch {}
}
