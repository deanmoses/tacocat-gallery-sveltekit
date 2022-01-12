<!--
  @component

  Header of the site
-->

<script lang="ts">
	import SearchIcon from "./icons/SearchIcon.svelte";

	/** Don't show the site's title (this is different than the page title)*/
	export let hideSiteTitle = false;
</script>

<header>
  <h1><slot /></h1>

  <div>
    {#if !hideSiteTitle}
      <span class="site-title hidden-xs">Dean, Lucie, Felix and Milo Moses</span>
    {/if}
    <a href="/search" class="hidden-xxs">
			<SearchIcon />
    </a>
  </div>
</header>

<style>
  header {
    display: flex;
		align-items: center;

    padding: var(--default-padding);
    padding-left: calc(var(--default-padding) * 2);
    background-color: var(--header-color);
    border-bottom: var(--default-border);

    color: var(--default-text-color);
  }

	h1 {
    font-size: 28px;
    min-height: 1.5em; /* for when there's no h1 text */
  }

  div {
    margin-left: auto;

    display: flex;
		align-items: center;
    gap: 0.7em;
  }

  a {
    color: var(--default-text-color);
  }
</style>