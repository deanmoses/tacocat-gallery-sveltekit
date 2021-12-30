<script lang="ts">
    import Root from "$lib/pages/album/RootAlbumPage.svelte";
    import { store } from '$lib/stores/store';
    import { derived } from 'svelte/store';

    export const album = derived(
      store,
      $store => $store.album
    );
</script>

<Root album={album} />