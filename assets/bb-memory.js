// The troll's memory: seasons, night, visits, its lines, and the phone's tilt and shake.
// Pure functions only, shared by index.html (window.BBMemory) and the tests (node --test).
(function (root) {
  const pad = (v) => (v < 10 ? '0' : '') + v;
  const clamp = (v) => Math.max(-1, Math.min(1, v));
  const dayKey = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const parseDay = (s) => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || ''); if (!m) return null; const d = new Date(+m[1], m[2] - 1, +m[3], 12); return d.getMonth() === m[2] - 1 && d.getDate() === +m[3] ? d : null; };

  function season(d) {
    const m = d.getMonth() + 1, day = d.getDate();
    if ((m === 12 && day === 31) || (m === 1 && day === 1)) return 'newyear';
    if (m === 12 && day <= 26) return 'xmas';
    if (m === 10 && day >= 25) return 'halloween';
    return null;
  }
  const isNight = (h) => h >= 21 || h < 6;

  function recordVisit(prev, today) {
    const ok = prev && typeof prev === 'object' && Number.isInteger(prev.n) && prev.n > 0 && parseDay(prev.last) && parseDay(prev.first);
    if (!ok) return { n: 1, first: today, last: today, gapDays: 0, isNewDay: true };
    if (prev.last === today) return { n: prev.n, first: prev.first, last: today, gapDays: 0, isNewDay: false };
    const gap = Math.round((parseDay(today) - parseDay(prev.last)) / 864e5);
    return { n: prev.n + 1, first: prev.first, last: today, gapDays: gap, isNewDay: true };
  }
  const unlocks = (n) => ({ scarf: n >= 2, baby: n >= 3, whale: n >= 4, crown: n >= 5 });

  const VISIT = { 2: 'You came back!', 3: 'Third time! I brought a friend.', 4: "I named the whale. It's Gertrud.", 5: 'Five visits. You get a crown.' };
  const ROTATE = ['Back again? Good.', 'The moose says hi.', 'I saved you a snowflake.', 'Gertrud sang about you.', 'Shh. The mountains are napping.'];
  function pickLine(o) {
    if (!o.isNewDay || o.n < 2) return null;
    if (o.season === 'xmas') return o.date.getDate() >= 24 ? 'Merry Christmas!' : "It's snowing! I got a hat.";
    if (o.season === 'newyear') return 'Happy New Year!';
    if (o.season === 'halloween') return 'Boo! Did I scare you?';
    if (o.night) return "Shouldn't you be asleep?";
    if (o.gapDays > 30) return 'Long time no see!';
    return VISIT[o.n] || ROTATE[(o.n - 6) % ROTATE.length];
  }

  // beta/gamma in degrees; angle = screen rotation (0, 90, -90/270, 180). Returns screen-space lean, -1..1.
  // The raw angles are turned into the screen's own axes first; then the usual ~40° reading tilt is taken off "down".
  function tiltFromOrientation(beta, gamma, angle) {
    const b = beta || 0, g = gamma || 0, a = ((((angle || 0) % 360) + 360) % 360);
    const [X, Y] = a === 90 ? [b, -g] : a === 270 ? [-b, g] : a === 180 ? [-g, -b] : [g, b];
    const r = (v) => (Math.abs(v) < 1e-12 ? 0 : v);
    return { x: r(clamp(X / 35)), y: r(clamp((Y - 40) / 35)) };
  }

  function makeShake(thresh = 17, coolMs = 2000) {
    let lastT = -Infinity;
    return (ax, ay, az, t) => {
      if (Math.hypot(ax || 0, ay || 0, az || 0) <= thresh || t - lastT < coolMs) return false;
      lastT = t; return true;
    };
  }

  function overrides(search) {
    const q = new URLSearchParams(search || ''), num = (k) => (q.has(k) && q.get(k).trim() !== '' ? Number(q.get(k)) : NaN);
    const h = num('time'), v = num('besoeg'), tl = (q.get('tilt') || '').split(',').map(Number);
    return {
      date: parseDay(q.get('dato')),
      hour: Number.isInteger(h) && h >= 0 && h <= 23 ? h : null,
      visit: Number.isInteger(v) && v >= 1 ? v : null,
      tilt: tl.length === 2 && tl.every((x) => Number.isFinite(x)) ? { x: clamp(tl[0]), y: clamp(tl[1]) } : null,
    };
  }

  const api = { season, isNight, dayKey, recordVisit, unlocks, pickLine, tiltFromOrientation, makeShake, overrides };
  if (typeof module === 'object' && module.exports) module.exports = api; else root.BBMemory = api;
})(typeof window !== 'undefined' ? window : globalThis);
