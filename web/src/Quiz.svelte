<script>
  import { isCorrect, pickCard, updateWeight, choices, multiplier } from './lib/quiz.js';
  import { load, save, nextProgress, view, DAILY_GOAL } from './lib/progress.js';

  let { cards, mode, onexit } = $props();

  const weights = new Map(); // session only
  const deal = (c) => (mode === 'choice' ? choices(c, cards) : []);
  const focus = (el) => el.focus();

  // .raw: pickCard/choices compare cards by identity.
  let card = $state.raw(null);
  let options = $state.raw([]);
  let result = $state.raw(null); // { correct, picked? }
  let input = $state('');
  let xp = $state(0);
  let combo = $state(0);
  let stats = $state(view(load()));
  let timer;

  $effect(() => () => clearTimeout(timer));

  function answer(correct, picked) {
    if (result) return;
    updateWeight(weights, card, correct);
    combo = correct ? combo + 1 : 0;
    if (correct) xp += 10 * multiplier(combo);
    const p = nextProgress(load(), combo);
    save(p);
    stats = view(p);
    result = { correct, picked };
    if (correct) timer = setTimeout(next, 600);
  }

  function next() {
    clearTimeout(timer);
    card = pickCard(cards, weights, card);
    options = deal(card);
    input = '';
    result = null;
  }

  function submit(e) {
    e.preventDefault();
    if (result) next();
    else if (input.trim()) answer(isCorrect(card, input));
  }

  next(); // deal the first card
</script>

<div class="is-flex is-align-items-center is-justify-content-space-between is-flex-wrap-wrap mb-4">
  <button class="button is-text" onclick={onexit}>← Back</button>
  <div class="tags">
    <span class="tag is-medium">XP {xp}</span>
    <span class="tag is-medium" class:is-warning={multiplier(combo) > 1}>
      Combo {combo}{multiplier(combo) > 1 ? ` ×${multiplier(combo)}` : ''}
    </span>
    <span class="tag is-medium" class:is-success={stats.today >= DAILY_GOAL}>Today {Math.min(stats.today, DAILY_GOAL)}/{DAILY_GOAL}</span>
    <span class="tag is-medium">🔥 {stats.streak}</span>
  </div>
</div>

<div class="box flash" class:correct={result?.correct} class:wrong={result && !result.correct}>
  {mode === 'type' ? card.char : card.answers[0]}
</div>

{#if mode === 'type'}
  <form onsubmit={submit}>
    <input
      class="input is-large has-text-centered"
      class:is-success={result?.correct}
      class:is-danger={result && !result.correct}
      bind:value={input}
      use:focus
      readonly={!!result}
      aria-label="Type the romanization"
      placeholder="type the reading, press Enter"
      autocomplete="off"
      autocapitalize="off"
      spellcheck="false"
    />
    <!-- mousedown preventDefault keeps focus (and the mobile keyboard) on the input -->
    <button class="button is-primary is-medium is-fullwidth mt-3" type="submit" onmousedown={(e) => e.preventDefault()}>
      {result ? 'Next' : 'Submit'}
    </button>
  </form>
{:else}
  <div class="fixed-grid has-2-cols">
    <div class="grid">
      {#each options as o (o.char)}
        <!-- not `disabled` after answering: Bulma fades disabled buttons and hides the colours -->
        <button
          class="cell button is-large option"
          class:is-success={result && o === card}
          class:is-danger={result?.picked === o && o !== card}
          onclick={() => answer(o === card, o)}>{o.char}</button
        >
      {/each}
    </div>
  </div>
{/if}

<div class="mt-4" aria-live="polite">
  {#if result?.correct}
    <div class="notification is-success is-light">Correct!</div>
  {:else if result}
    <div class="notification is-danger is-light is-flex is-align-items-center is-justify-content-space-between">
      <span>Answer: <strong>{mode === 'type' ? card.answers.join(' / ') : card.char}</strong></span>
      {#if mode !== 'type'}<button class="button is-danger" onclick={next}>Next</button>{/if}
    </div>
  {/if}
</div>
