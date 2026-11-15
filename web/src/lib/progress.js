const KEY = 'charly.progress';
export const DAILY_GOAL = 10;

const dayKey = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const yesterdayKey = (now) => {
  const d = new Date(now);
  d.setDate(d.getDate() - 1);
  return dayKey(d);
};

// Pure: progress after one answered card. p = { day, count, streak, lastPracticed, bestCombo }
export function nextProgress(p, combo, now = new Date()) {
  const today = dayKey(now);
  const n = { ...p };
  if (n.day !== today) Object.assign(n, { day: today, count: 0 });
  n.count++;
  if (n.count === DAILY_GOAL) {
    n.streak = n.lastPracticed === yesterdayKey(now) ? (n.streak ?? 0) + 1 : 1;
    n.lastPracticed = today;
  }
  n.bestCombo = Math.max(n.bestCombo ?? 0, combo);
  return n;
}

// Pure: what the UI shows. A streak only survives if practiced today or yesterday.
export function view(p, now = new Date()) {
  const alive = p.lastPracticed === dayKey(now) || p.lastPracticed === yesterdayKey(now);
  return {
    streak: alive ? (p.streak ?? 0) : 0,
    today: p.day === dayKey(now) ? p.count : 0,
    bestCombo: p.bestCombo ?? 0,
  };
}

// localStorage can throw (private mode, blocked storage); the app must still work without it.
export function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) ?? {};
  } catch {
    return {};
  }
}

export function save(p) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {}
}
