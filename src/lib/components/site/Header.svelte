<!--
  @component

  Header of the site
-->

<script lang="ts">
    /** Don't show the site's title */
    export let hideSiteTitle = false;
</script>

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

  svg {
    color: var(--default-text-color);
  }
</style>

<header>
  <h1 class="hidden-xs"><slot name="title" /></h1>
  <h1 class="visible-xs"><slot name="short-title" /></h1>

  <div>
    {#if !hideSiteTitle}
      <span class="site-title hidden-xs">Dean, Lucie, Felix and Milo Moses</span>
    {/if}
    <a href="/search" class="hidden-xxs">
      <svg style="width: 1em; height: 1em;" viewBox="0 0 1201.8333740234375 1199"><title>Search</title><path style="fill: currentcolor;" d="M491 0q100 0 191 39t156.5 104.5T943 300t39 191l-1 2 1 5q0 141-78 262l275 274q23 26 22.5 44.5T1179 1121l-59 58q-26 20-46.5 20t-39.5-20L759 905q-119 77-261 77l-5-1-2 1q-100 0-191-39T143.5 838.5 39 682 0 491t39-191 104.5-156.5T300 39 491 0zm0 169q-88 0-162 43T212 329t-43 162 43 162 117 117 162 43 162-43 117-117 43-162-43-162-117-117-162-43z"></path></svg>
    </a>
  </div>
</header>
