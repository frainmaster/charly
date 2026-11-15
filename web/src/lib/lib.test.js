import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { isCorrect, pickCard, choices } from './quiz.js';
import { nextProgress, view, DAILY_GOAL } from './progress.js';

const read = (f) => JSON.parse(readFileSync(new URL(`../languages/japanese/${f}.json`, import.meta.url), 'utf8'));
const hira = read('hiragana');
const kata = read('katakana');
const all = [...hira, ...kata];

test('answers are trimmed and case-insensitive', () => {
  assert.ok(isCorrect(hira[11], ' SI ')); // し
  assert.ok(!isCorrect(hira[11], 'su'));
});

test('pickCard never repeats the previous card', () => {
  let prev = null;
  for (let i = 0; i < 500; i++) {
    const c = pickCard(hira, new Map(), prev);
    assert.notEqual(c, prev);
    prev = c;
  }
  assert.equal(pickCard([hira[0]], new Map(), hira[0]), hira[0]);
});

test('choices: 4 unique options, only one correct, across both scripts', () => {
  for (const card of all) {
    const opts = choices(card, all);
    assert.equal(opts.length, 4);
    assert.equal(new Set(opts).size, 4);
    assert.ok(opts.includes(card));
    for (const o of opts) if (o !== card) assert.ok(!o.answers.some((a) => card.answers.includes(a)), `${o.char} vs ${card.char}`);
  }
});

test('data: valid cards, no duplicates, katakana mirrors hiragana', () => {
  assert.equal(hira.length, 104);
  for (const script of [hira, kata]) {
    assert.equal(new Set(script.map((c) => c.char)).size, script.length);
    for (const c of script) assert.ok(c.answers.length && c.answers.every((a) => a === a.toLowerCase().trim() && a));
  }
  hira.forEach((h, i) => {
    const shifted = [...h.char].map((ch) => String.fromCodePoint(ch.codePointAt(0) + 0x60)).join('');
    assert.equal(kata[i].char, shifted);
    assert.deepEqual([kata[i].answers, kata[i].group], [h.answers, h.group]);
  });
});

test('daily streak: goal, consecutive days, gaps', () => {
  const day = (d) => new Date(2026, 0, d, 12);
  const practice = (p, d, n = DAILY_GOAL) => {
    for (let i = 0; i < n; i++) p = nextProgress(p, 3, day(d));
    return p;
  };
  let p = practice({}, 1, DAILY_GOAL - 1);
  assert.equal(view(p, day(1)).streak, 0);
  p = practice(p, 1, 1);
  assert.deepEqual(view(p, day(1)), { streak: 1, today: DAILY_GOAL, bestCombo: 3 });
  p = practice(p, 1); // extra cards the same day don't bump it
  p = practice(p, 2);
  assert.equal(view(p, day(2)).streak, 2);
  assert.equal(view(p, day(3)).streak, 2); // still alive until today's goal
  assert.equal(view(p, day(4)).streak, 0); // missed day 3
  p = practice(p, 4);
  assert.equal(view(p, day(4)).streak, 1);
});
