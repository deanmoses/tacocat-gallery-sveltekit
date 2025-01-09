<!--
  @component Page to show while waiting for album to process (e.g. during rename)
-->
<script lang="ts">
    import BlankAlbumPageLayout from './BlankAlbumPageLayout.svelte';
    import WaitingSpinner from '$lib/components/site/WaitingSpinner.svelte';

  interface Props {
    title: string;
  }

  let { title }: Props = $props();
</script>

<BlankAlbumPageLayout {title}>
    <p>{title}</p>
    <WaitingSpinner />
</BlankAlbumPageLayout>
