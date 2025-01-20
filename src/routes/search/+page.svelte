<script lang="ts">
    import type { PageProps } from './$types';
    import SearchPage from '$lib/components/pages/search/SearchPage.svelte';

    let { data }: PageProps = $props();
    let returnPath = $derived(data.returnPath);
</script>

<SearchPage {returnPath} />
