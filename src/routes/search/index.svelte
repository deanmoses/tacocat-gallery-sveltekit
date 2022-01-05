<script context="module" lang="ts">
	export async function load({ url }) {
        const returnPath = url.searchParams.get('return')
        return {
            props: {
                returnPath
            }
        }
    }
</script>

<script lang="ts">
    import SearchPage from "$lib/components/pages/search/SearchPage.svelte";

    export let returnPath: string;
</script>

<SearchPage {returnPath} />