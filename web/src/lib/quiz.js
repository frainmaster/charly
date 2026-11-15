export const isCorrect = (card, input) => card.answers.includes(input.trim().toLowerCase());

const weightOf = (weights, card) => weights.get(card.char) ?? 1;

// Weighted random pick; never returns `prev` unless it's the only card.
export function pickCard(cards, weights, prev, rand = Math.random) {
  const pool = cards.length > 1 ? cards.filter((c) => c !== prev) : cards;
  let r = rand() * pool.reduce((sum, c) => sum + weightOf(weights, c), 0);
  for (const c of pool) {
    r -= weightOf(weights, c);
    if (r < 0) return c;
  }
  return pool[pool.length - 1];
}

// Misses double a card's weight, hits shrink it; bounded so no card vanishes or dominates.
export function updateWeight(weights, card, correct) {
  const w = weightOf(weights, card);
  weights.set(card.char, correct ? Math.max(0.25, w * 0.7) : Math.min(8, w * 2));
}

function shuffle(arr, rand) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Options for roman → char mode. Distractors never share an answer with the card (ぢ/じ, か/カ).
export function choices(card, cards, n = 4, rand = Math.random) {
  const wrong = cards.filter((c) => !c.answers.some((a) => card.answers.includes(a)));
  return shuffle([card, ...shuffle(wrong, rand).slice(0, n - 1)], rand);
}

export const multiplier = (combo) => Math.min(4, 1 + Math.floor(combo / 5));
