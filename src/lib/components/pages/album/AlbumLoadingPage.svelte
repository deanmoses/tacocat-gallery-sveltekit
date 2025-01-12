<!--
  @component
  
  Stencil page to show while waiting for album to load
-->
<script lang="ts">
    import BlankAlbumPageLayout from './BlankAlbumPageLayout.svelte';
    import WaitingSpinner from '$lib/components/site/WaitingSpinner.svelte';
</script>

<BlankAlbumPageLayout title="Loading...">
    <WaitingSpinner />
</BlankAlbumPageLayout>
