<!--
  @component Page that displays an error instead of an album
-->
<script lang="ts">
    import BlankAlbumPageLayout from './BlankAlbumPageLayout.svelte';

  interface Props {
    title?: string;
    children?: import('svelte').Snippet;
  }

  let { title = 'Error', children }: Props = $props();
</script>

<BlankAlbumPageLayout {title} hideFooter>
    {@render children?.()}
</BlankAlbumPageLayout>
