<script lang="ts">
  import Router from 'svelte-spa-router';
  import svelteLogo from './assets/svelte.svg'
  import appLogo from './assets/logo-nobg.png'
  import viteLogo from '/vite.svg'
  import Counter from './lib/Counter.svelte'
  import MainComponent from './routes/MainComponent.svelte';
  import NotFound from './routes/NotFound.svelte';
  import Profile from './routes/Profile.svelte';

  const routes = {
    '/': MainComponent,
    '/profile': Profile,
    '*': NotFound
  }
</script>

<div class="logo-div">
  <img src={appLogo} class="logo-nobg" alt="App Logo" width="148" height="64" />
</div>
<main>

  <!-- <div>
    <a href="https://vite.dev" target="_blank" rel="noreferrer">
      <img src={viteLogo} class="logo" alt="Vite Logo" />
    </a>
    <a href="https://svelte.dev" target="_blank" rel="noreferrer">
      <img src={svelteLogo} class="logo svelte" alt="Svelte Logo" />
    </a>
  </div>
  <h1>jobsGPT</h1>

  <div class="card">
    <Counter />
  </div> -->
  <Router {routes} />

</main>

<style>

  /* .logo {
    height: 6em;
    padding: 1.5em;
    will-change: filter;
    transition: filter 300ms;
  }
  .logo:hover {
    filter: drop-shadow(0 0 2em #646cffaa);
  }
  .logo.svelte:hover {
    filter: drop-shadow(0 0 2em #ff3e00aa);
  }
  .read-the-docs {
    color: #888;
  } */
</style>
