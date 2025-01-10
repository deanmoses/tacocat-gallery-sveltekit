<script lang="ts">
    import SearchPage from '$lib/components/pages/search/SearchPage.svelte';
    import type { PageData } from './$types';

    interface Props {
        data: PageData;
    }

    let { data }: Props = $props();

    let returnPath = $derived(data.returnPath);
</script>

<SearchPage {returnPath} />
