<script lang="ts">
    import Root from "$lib/pages/album/RootAlbumPage.svelte";
    import { store } from '$lib/stores/store';
</script>

<Root album={$store.album} />