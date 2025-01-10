<!--
  @component 
  
  Page that displays blank search input
-->
<script lang="ts">
    import { preventDefault } from 'svelte/legacy';
    import type { Snippet } from 'svelte';
    import { goto } from '$app/navigation';
    import SiteLayout from '$lib/components/site/SiteLayout.svelte';
    import ReturnIcon from '$lib/components/site/icons/ReturnIcon.svelte';
    import { localSearchUrl } from '$lib/utils/config';

    interface Props {
        searchTerms?: string;
        returnPath?: string;
        title?: string;
        children?: Snippet;
    }

    let { searchTerms = $bindable(''), returnPath = '', title = '', children }: Props = $props();

    let searchInput: HTMLInputElement = $state();

    let pageTitle = $derived(searchTerms ? `Search for ${searchTerms}` : title || 'Search The Moses Family');
    let disabled = $derived(3 > searchTerms.length);

    function autofocus(formInput: HTMLInputElement) {
        formInput.focus();
    }

    function onInput() {
        searchTerms = searchInput.value;
    }

    function onSubmit() {
        const terms = searchInput.value;
        if (terms) {
            const oldestYear = toInt((document.getElementById('oldestYear') as HTMLInputElement)?.value);
            const newestYear = toInt((document.getElementById('newestYear') as HTMLInputElement)?.value);
            const oldestFirst = toBool((document.getElementById('oldestFirst') as HTMLInputElement)?.checked);
            goto(localSearchUrl({ terms, oldestYear, newestYear, oldestFirst }, returnPath));
        }
    }

    function toInt(s: string | null): number | undefined {
        return s ? parseInt(s, 10) : undefined;
    }

    function toBool(s: boolean | null): boolean {
        return s ?? false;
    }
</script>

<svelte:head>
    <title>{pageTitle}</title>
</svelte:head>

<SiteLayout hideFooter>
    <header>
        <a href={returnPath}><ReturnIcon /></a>
        <form onsubmit={preventDefault(onSubmit)}>
            <input
                name="searchTerms"
                type="text"
                placeholder="search"
                autocapitalize="off"
                value={searchTerms}
                oninput={onInput}
                bind:this={searchInput}
                use:autofocus
            />
            <button type="submit" class="btn" {disabled}> Search </button>
        </form>
    </header>
    {@render children?.()}
</SiteLayout>

<style>
    header {
        display: flex;
        align-items: center;

        padding: var(--default-padding);
        padding-left: calc(var(--default-padding) * 2);
        background-color: var(--header-color);
    }

    a {
        color: var(--default-text-color);
        font-size: 28px;
        min-height: 1.5em; /* for when there's no h1 text */
    }

    form {
        margin-left: auto;
    }

    input {
        width: 15em;
    }

    button {
        background-color: var(--button-color);
    }
</style>
