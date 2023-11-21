<!--
  @component Page that displays an error instead of an album
-->
<script lang="ts">
    import BlankAlbumPageLayout from './BlankAlbumPageLayout.svelte';

    export let title = 'Error';
</script>

<BlankAlbumPageLayout {title} hideFooter>
    <slot />
</BlankAlbumPageLayout>
