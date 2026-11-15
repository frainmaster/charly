<script>
  import { languages } from './lib/languages.js';
  import { load, view } from './lib/progress.js';
  import Quiz from './Quiz.svelte';

  // .raw: cards are compared by identity in quiz.js, so keep them unproxied.
  let lang = $state.raw(languages[0]);
  let picked = $state(languages[0].scripts.map((s) => s.id));
  let mode = $state('type');
  let playing = $state(false);
  let stats = $state(view(load()));

  const cards = $derived(lang.scripts.filter((s) => picked.includes(s.id)).flatMap((s) => s.cards));

  function selectLanguage(l) {
    lang = l;
    picked = l.scripts.map((s) => s.id);
  }
</script>

<section class="section">
  <div class="container is-max-tablet">
    {#if playing}
      <Quiz {cards} {mode} onexit={() => ((playing = false), (stats = view(load())))} />
    {:else}
      <h1 class="title is-2">charly</h1>
      <p class="subtitle is-6">🔥 {stats.streak} day streak · best combo {stats.bestCombo}</p>

      <div class="box">
        <fieldset class="field">
          <legend class="label">Language</legend>
          <div class="radios">
            {#each languages as l (l.id)}
              <label class="radio"><input type="radio" name="lang" checked={l === lang} onchange={() => selectLanguage(l)} /> {l.name}</label>
            {/each}
          </div>
        </fieldset>

        <fieldset class="field">
          <legend class="label">Scripts</legend>
          <div class="checkboxes">
            {#each lang.scripts as s (s.id)}
              <label class="checkbox cap"><input type="checkbox" bind:group={picked} value={s.id} /> {s.id}</label>
            {/each}
          </div>
        </fieldset>

        <fieldset class="field">
          <legend class="label">Mode</legend>
          <div class="radios">
            <label class="radio"><input type="radio" bind:group={mode} value="type" /> Character → roman (type)</label>
            <label class="radio"><input type="radio" bind:group={mode} value="choice" /> Roman → character (pick)</label>
          </div>
        </fieldset>
      </div>

      <button class="button is-success is-medium is-fullwidth" disabled={!cards.length} onclick={() => (playing = true)}>Start</button>
    {/if}
  </div>
</section>
