<!--
  @component Layout of gallery administration area
-->
<script lang="ts">
    import SiteLayout from '$lib/components/site/SiteLayout.svelte';
    import ReturnIcon from '$lib/components/site/icons/ReturnIcon.svelte';
</script>

<svelte:head>
    <title>Administer Gallery</title>
</svelte:head>

<SiteLayout>
    <header>
        <a href="/"><ReturnIcon /></a>
        <h1>Administer Gallery</h1>
    </header>

    <slot />
</SiteLayout>

<style>
    header {
        display: flex;
        align-items: center;

        padding: var(--default-padding);
        padding-left: calc(var(--default-padding) * 2);
        padding-right: calc(var(--default-padding) * 2);
        background-color: var(--header-color);
    }

    a {
        color: var(--default-text-color);
        font-size: 28px;
        min-height: 1.5em; /* for when there's no h1 text */
    }

    h1 {
        margin-left: auto;
    }
</style>
