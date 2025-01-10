<!--
  @component 
  
  Header of the site
-->
<script lang="ts">
    import SearchIcon from './icons/SearchIcon.svelte';
    import { page } from '$app/state';
    import { siteTitle } from '$lib/utils/config';
    import type { Snippet } from 'svelte';

    interface Props {
        /** Hide the header on small viewports */
        hideWhenSmall?: boolean;

        /** Don't show the bottom border of the header.  Which you don't when there's nav buttons below the header. */
        hideBottomBorder?: boolean;

        /** Don't show the search icon */
        hideSearch?: boolean;

        /** Don't show the site's title (this is different than the page title)*/
        hideSiteTitle?: boolean;

        children?: Snippet;
    }

    let {
        hideWhenSmall = false,
        hideBottomBorder = false,
        hideSearch = false,
        hideSiteTitle = false,
        children,
    }: Props = $props();
</script>

<header class:bottomBorder={!hideBottomBorder} class:hidden-sm={hideWhenSmall}>
    <h1>{@render children?.()}</h1>

    <div>
        {#if !hideSiteTitle}
            <span class="site-title hidden-xs">{siteTitle()}</span>
        {/if}
        {#if !hideSearch}
            <a href="/search?returnPath={page.url.pathname}" class="hidden-xxs" title="Search">
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
