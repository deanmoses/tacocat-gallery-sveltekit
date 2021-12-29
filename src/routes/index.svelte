<script lang="ts">
    import Root from "$lib/pages/album/RootAlbumPage.svelte";
    import { album } from '$lib/stores/store';
</script>

<Root album={album} />