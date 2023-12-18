<!--
  @component

  Page that displays a blank search input
-->
<script lang="ts">
    import { goto } from '$app/navigation';
    import SiteLayout from '$lib/components/site/SiteLayout.svelte';
    import ReturnIcon from '$lib/components/site/icons/ReturnIcon.svelte';

    export let searchTerms: string = '';
    export let returnPath: string = '';
    export let title: string = '';

    let searchInput: HTMLInputElement;

    $: pageTitle = searchTerms ? `Search for ${searchTerms}` : title || 'Search The Moses Family';
    $: disabled = 3 > searchTerms.length;

    function autofocus(formInput: HTMLInputElement) {
        formInput.focus();
    }

    function onInput() {
        searchTerms = searchInput.value;
    }

    function onSubmit() {
        const searchTerms = searchInput.value;
        if (searchTerms) {
            goto(`/search/${searchTerms}?returnPath=${returnPath}`);
        }
    }
</script>

<svelte:head>
    <title>{pageTitle}</title>
</svelte:head>

<SiteLayout hideFooter>
    <header>
        <a href={returnPath}>
            <ReturnIcon />
        </a>
        <form on:submit|preventDefault={onSubmit}>
            <input
                name="searchTerms"
                type="text"
                placeholder="search"
                value={searchTerms}
                on:input={onInput}
                bind:this={searchInput}
                use:autofocus
            />
            <button type="submit" class="btn" {disabled}> Search </button>
        </form>
    </header>

    <slot />
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
