<!--
  @component Page that displays an error instead of an image
-->
<script lang="ts">
    import BlankImagePageLayout from './layouts/BlankImagePageLayout.svelte';

  interface Props {
    title?: string;
    children?: import('svelte').Snippet;
  }

  let { title = 'Error', children }: Props = $props();
</script>

<BlankImagePageLayout {title}>
    {@render children?.()}
</BlankImagePageLayout>
