<script context="module" lang="ts">
	export async function load({ url }) {
        const returnUrl = url.searchParams.get('return')
        console.log(`returnUrl: ${returnUrl}`)
        return {
            props: {
                returnUrl
            }
        }
    }
</script>

<script lang="ts">
    import SearchPage from "$lib/components/pages/search/SearchPage.svelte";

    export let returnUrl: string;
</script>

<SearchPage {returnUrl} />