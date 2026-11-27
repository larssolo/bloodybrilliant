// Pure logic behind the troll's memory, seasons, tilt and shake. Run: node --test tests/
const test = require('node:test');
const assert = require('node:assert/strict');
const M = require('../assets/bb-memory.js');

const D = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d, 12); };

test('season: Christmas runs 1-26 December', () => {
  assert.equal(M.season(D('2026-12-01')), 'xmas');
  assert.equal(M.season(D('2026-12-26')), 'xmas');
  assert.equal(M.season(D('2026-12-27')), null);
});

test('season: New Year is 31 December and 1 January', () => {
  assert.equal(M.season(D('2026-12-31')), 'newyear');
  assert.equal(M.season(D('2027-01-01')), 'newyear');
  assert.equal(M.season(D('2027-01-02')), null);
});

test('season: Halloween runs 25-31 October', () => {
  assert.equal(M.season(D('2026-10-25')), 'halloween');
  assert.equal(M.season(D('2026-10-31')), 'halloween');
  assert.equal(M.season(D('2026-10-24')), null);
});

test('isNight: 21:00 to 05:59', () => {
  assert.equal(M.isNight(21), true);
  assert.equal(M.isNight(5), true);
  assert.equal(M.isNight(6), false);
  assert.equal(M.isNight(20), false);
});

test('dayKey is the local date', () => {
  assert.equal(M.dayKey(new Date(2026, 0, 5, 23, 30)), '2026-01-05');
});

test('recordVisit: first visit', () => {
  assert.deepEqual(M.recordVisit(null, '2026-11-27'), { n: 1, first: '2026-11-27', last: '2026-11-27', gapDays: 0, isNewDay: true });
});

test('recordVisit: garbage in storage counts as a first visit', () => {
  assert.deepEqual(M.recordVisit('garbage', '2026-11-27'), M.recordVisit(null, '2026-11-27'));
  assert.deepEqual(M.recordVisit({ n: 'x' }, '2026-11-27'), M.recordVisit(null, '2026-11-27'));
});

test('recordVisit: a reload the same day does not count', () => {
  const r = M.recordVisit({ n: 2, first: '2026-11-01', last: '2026-11-27' }, '2026-11-27');
  assert.equal(r.n, 2);
  assert.equal(r.isNewDay, false);
  assert.equal(r.first, '2026-11-01');
});

test('recordVisit: a new day counts and measures the gap', () => {
  const r = M.recordVisit({ n: 2, first: '2026-09-01', last: '2026-10-01' }, '2026-11-27');
  assert.equal(r.n, 3);
  assert.equal(r.gapDays, 57);
  assert.equal(r.isNewDay, true);
  assert.equal(r.first, '2026-09-01');
});

test('unlocks grow with visits', () => {
  assert.deepEqual(M.unlocks(4), { scarf: true, baby: true, whale: true, crown: false });
  assert.deepEqual(M.unlocks(1), { scarf: false, baby: false, whale: false, crown: false });
  assert.equal(M.unlocks(5).crown, true);
});

const L = (o) => M.pickLine(Object.assign({ n: 3, isNewDay: true, gapDays: 0, season: null, night: false, date: D('2026-11-27') }, o));

test('pickLine: silent on the first visit and on same-day reloads', () => {
  assert.equal(L({ n: 1 }), null);
  assert.equal(L({ isNewDay: false }), null);
  assert.equal(L({ n: 1, season: 'xmas', date: D('2026-12-24') }), null);
});

test('pickLine: seasons win', () => {
  assert.equal(L({ season: 'xmas', date: D('2026-12-24') }), 'Merry Christmas!');
  assert.equal(L({ season: 'xmas', date: D('2026-12-10') }), "It's snowing! I got a hat.");
  assert.equal(L({ season: 'newyear', date: D('2026-12-31') }), 'Happy New Year!');
  assert.equal(L({ season: 'halloween', date: D('2026-10-30') }), 'Boo! Did I scare you?');
});

test('pickLine: night, then long absence, then visit lines', () => {
  assert.equal(L({ n: 2, night: true }), "Shouldn't you be asleep?");
  assert.equal(L({ gapDays: 40 }), 'Long time no see!');
  assert.equal(L({ n: 2 }), 'You came back!');
  assert.equal(L({ n: 3 }), 'Third time! I brought a friend.');
  assert.equal(L({ n: 4 }), "I named the whale. It's Gertrud.");
  assert.equal(L({ n: 5 }), 'Five visits. You get a crown.');
  assert.equal(L({ n: 6 }), 'Back again? Good.');
  assert.equal(L({ n: 7 }), 'The moose says hi.');
  assert.equal(L({ n: 11 }), 'Back again? Good.');
});

const near = (a, b) => Math.abs(a - b) < 1e-9;

test('tiltFromOrientation: upright portrait is level', () => {
  const t = M.tiltFromOrientation(40, 0, 0);
  assert.ok(near(t.x, 0) && near(t.y, 0));
});

test('tiltFromOrientation: tilt right, clamped', () => {
  assert.ok(near(M.tiltFromOrientation(40, 35, 0).x, 1));
  assert.ok(near(M.tiltFromOrientation(40, 200, 0).x, 1));
  assert.ok(near(M.tiltFromOrientation(40, -200, 0).x, -1));
});

test('tiltFromOrientation: landscape turns the axes', () => {
  const a = M.tiltFromOrientation(40, 35, 90), b = M.tiltFromOrientation(40, 35, -90);
  assert.ok(near(Math.abs(a.y), 1) && near(a.x, 0));
  assert.ok(near(Math.abs(b.y), 1) && near(b.x, 0));
  assert.ok(near(a.y, -b.y));
});

test('makeShake: fires on a hard shake, then cools down for 2 s', () => {
  const sh = M.makeShake();
  assert.equal(sh(0, 0, 20, 0), true);
  assert.equal(sh(0, 0, 20, 500), false);
  assert.equal(sh(0, 0, 20, 2600), true);
  assert.equal(sh(0, 0, 5, 5000), false);
});

test('overrides: reads dato, time, besoeg and tilt', () => {
  const o = M.overrides('?dato=2026-12-24&time=23&besoeg=4&tilt=0.5,-1');
  assert.equal(M.dayKey(o.date), '2026-12-24');
  assert.equal(o.hour, 23);
  assert.equal(o.visit, 4);
  assert.deepEqual(o.tilt, { x: 0.5, y: -1 });
});

test('overrides: invalid or missing values are null', () => {
  assert.deepEqual(M.overrides('?time=99&dato=nope&besoeg=0&tilt=a'), { date: null, hour: null, visit: null, tilt: null });
  assert.deepEqual(M.overrides(''), { date: null, hour: null, visit: null, tilt: null });
});
