<script context="module" lang="ts">
	export async function load({ page }) {
        const year = page.params.year;
        return {props: {year}}
    }
</script>

<script lang="ts">
    import YearAlbumPage from "$lib/pages/album/YearAlbumPage.svelte";

    export let year;
</script>

<YearAlbumPage {year} />