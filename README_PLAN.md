# charly — plan

A Duolingo-style app for learning **writing-system characters** (not words). Pick a language, then answer an endless stream of quiz cards.

This file is the guide for future development sessions. Update it whenever a decision changes.

## Decisions (agreed 2026-11-15)

| Topic | Decision | Why |
|---|---|---|
| App type | SPA, no database, no backend in v1 | All data is static; quiz logic runs in the browser |
| Frontend | **Svelte 5 + Vite** (plain template, **not** SvelteKit) | A few screens don't need SvelteKit; its server features would go unused with a Go backend |
| Routing | None. A `screen` state variable (`pick` → `quiz`) | Add a router only if deep links are wanted |
| Styling | **Bulma 1.x** (npm, imported in `main.js`), plus a small `app.css` for what Bulma lacks | User's choice; class-only, so it suits Svelte. Has built-in dark mode |
| Persistence | `localStorage` only (stays on the device) | "No user data" on a server |
| Hosting | Static (GitHub Pages / Cloudflare Pages / Netlify) | Free, nothing to maintain |
| Future backend | **Go**, in the same repo | Only when accounts/sync are needed (see Roadmap) |

## Repo layout

```
charly/
  README_PLAN.md
  web/                      ← Svelte + Vite app (v1 is only this)
    src/
      languages/
        japanese/
          meta.json
          hiragana.json
          katakana.json
      ...
  main.go                   ← later: Go server (see "Future: Go backend")
```

## Language data

**One folder per language** under `web/src/languages/<lang>/`. The app finds folders automatically with `import.meta.glob`, so **adding a language means adding a folder, with no code changes**.

`meta.json`:
```json
{ "name": "Japanese", "scripts": ["hiragana", "katakana"], "font": null }
```
- `scripts`: names of the JSON files in the same folder.
- `font`: optional web font for scripts operating systems often lack (e.g. `"Noto Sans Thai"`).

Script file (e.g. `hiragana.json`), an array of cards:
```json
[
  { "char": "し", "answers": ["shi", "si"], "group": "base" },
  { "char": "きゃ", "answers": ["kya"], "group": "combo" }
]
```
- `answers`: every accepted romanization, lowercase. The first one is the prompt in roman → char mode. All are shown after a wrong typed answer. Include common informal spellings.
- `group`: a tier for filtering later. Japanese uses `base` / `dakuten` / `combo`. v1 does not expose filters.

## v1 scope (Japanese)

- **Scripts:** hiragana + katakana. The user picks one or both.
- **Coverage:** base 46 + dakuten/handakuten (が, ぱ) + combos (きゃ, しゅ …).
  - ん → `n`, `nn`
  - を → `wo`, `o`
  - Small っ/ゃ/ゅ/ょ: no cards of their own, only inside combos.
  - Obsolete ゐ/ゑ: left out.
  - Common alternatives: `shi/si`, `chi/ti`, `tsu/tu`, `fu/hu`, `ji/zi`, `sha/sya`, `ja/zya/jya`, etc.
- **Language picker** is generic, even though only Japanese exists.

### Quiz modes
1. **Character → roman (typed).** Case-insensitive, trimmed, Enter submits.
2. **Roman → character (multiple choice, 4 options).** Typing would need an IME, so this direction is never typed, for any script.

On a wrong answer, show the correct answer (`answers[0]`), then continue.

### Rules that must hold
- **Distractor rule:** wrong options must **never share any answer** with the correct card. Japanese already has collisions (ぢ/じ = ji, づ/ず = zu), and Thai has many (ข ฃ ค ฅ ฆ = kh).
- **No immediate repeat:** the same card never shows twice in a row.

### Card picking ("infinite")
- Weighted random: each card starts with a weight. A wrong answer increases it, a correct one decreases it, with a floor so no card disappears.
- Weights last for the session only, in memory.

### Game layer
- **Session:** XP per correct answer, combo counter, and a combo multiplier on XP.
- **Saved in `localStorage`:**
  - **Daily streak:** answering **10 cards** in a local calendar day counts as practiced. Missing a day resets the streak.
  - **Best combo** (all-time).
- Wrap every `localStorage` read/write in `try/catch`. It can throw in private browsing, and the app must still work without it.

### Out of scope for v1
Hearts/lives, levels, leagues, sounds, group filters/unlocks, accounts, cross-device sync, stroke order.

## Roadmap (priority order)

1. **Japanese:** hiragana + katakana (v1).
2. **Korean:** **jamo only** (consonants/vowels, not the ~11k syllable blocks). Accept position-dependent romanizations: ㄱ `g/k`, ㄷ `d/t`, ㅂ `b/p`, ㄹ `r/l`, ㅇ `ng` (and silent as a first letter, so decide on a display rule like "ㅇ (final)").
3. **Cyrillic:** **one folder per language** (`russian/`, `ukrainian/`, `belarusian/`, `serbian/`, `bulgarian/`, `macedonian/`, `kazakh/`, …). Romanization differs per language (Г = `g` in Russian, `h` in Ukrainian), and each has extra letters (Ukrainian і ї є ґ, Serbian ђ ј љ њ ћ џ). Duplicating letters across folders is fine. Accept informal spellings (ж `zh/j`, х `kh/h/x`, щ `shch/sch`).
4. **Thai:** consonants + vowels, **sound only** (no tones or consonant classes yet). Vowels display with the placeholder ◌ (◌า, เ◌). Set `font: "Noto Sans Thai"`. The distractor rule matters most here.

Never planned for this card format: Chinese hanzi (thousands of characters, tonal pinyin). Arabic is possible but harder, because each letter has positional forms.

## Future: Go backend

Add it only when something needs a server (accounts, progress sync, leaderboards).
- `main.go` at the repo root. `//go:embed web/dist` serves the built SPA, and the same binary serves `/api/*`.
- Result: one binary, one repo. Move the `localStorage` data to the API at that point.

## Status

v1 is built in `web/` (Svelte 5.57, Vite 8, Node 26 via fnm):
- `src/languages/japanese/`: 104 hiragana + 104 katakana cards. Rare ぢゃ/ぢゅ/ぢょ are omitted.
- `src/lib/quiz.js` (picking, weights, choices), `progress.js` (streak, localStorage), `languages.js` (folder loader).
- `src/App.svelte` (picker), `src/Quiz.svelte` (quiz screen).
- `src/lib/lib.test.js`: logic + data checks, including "katakana mirrors hiragana" (code point +0x60).

## Dev commands

```
cd web
npm install
npm run dev      # local dev server
npm test         # node:test, no extra deps
npm run build    # outputs web/dist (deploy this folder)
```

## Adding a new language — checklist

1. Create `web/src/languages/<lang>/meta.json` + one JSON per script.
2. Fill `answers` with every accepted spelling, the canonical one first.
3. Check for answer collisions inside the language (the distractor rule handles them, but know they exist).
4. Set `font` if operating systems commonly lack it.
5. Run the app, pick the language, and play through both modes.
