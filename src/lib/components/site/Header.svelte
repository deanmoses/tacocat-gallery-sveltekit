<!--
  @component

  Header of the site
-->

<script lang="ts">
	import SearchIcon from "./icons/SearchIcon.svelte";
	import { page } from "$app/stores";
	import Config from "$lib/utils/config";

	/** Hide the header on small viewports */
	export let hideWhenSmall = false;

	/** Don't show the bottom border of the header.  Which you don't when there's nav buttons below the header. */
	export let hideBottomBorder = false;

	/** Don't show the search icon */
	export let hideSearch = false;

	/** Don't show the site's title (this is different than the page title)*/
	export let hideSiteTitle = false;
</script>

<header class:bottomBorder={!hideBottomBorder} class:hidden-sm={hideWhenSmall}>
  <h1><slot /></h1>

  <div>
    {#if !hideSiteTitle}
      <span class="site-title hidden-xs">{Config.siteTitle}</span>
    {/if}
		{#if !hideSearch}
			<a href="/search?returnPath={$page.url.pathname}" class="hidden-xxs">
				<SearchIcon />
			</a>
		{/if}
  </div>
</header>

<style>
  header {
    display: flex;
		align-items: center;

    padding: var(--default-padding);
    padding-left: calc(var(--default-padding) * 2);
    background-color: var(--header-color);
    color: var(--default-text-color);
  }

	header.bottomBorder {
		border-bottom: var(--default-border);
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