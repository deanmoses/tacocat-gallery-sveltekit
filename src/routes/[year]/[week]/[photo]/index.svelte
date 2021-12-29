<script context="module" lang="ts">
	export async function load({ page }) {
    const slug = page.params.photo;
    return {props: {slug}}
  }
</script>

<script lang="ts">
    import PhotoPage from "$lib/pages/photo/PhotoPage.svelte";

    export let slug;
</script>

<PhotoPage {slug} />