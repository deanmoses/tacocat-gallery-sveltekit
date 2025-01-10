<!--
  @component 
  
  Page that displays an error instead of an image
-->
<script lang="ts">
    import BlankImagePageLayout from './layouts/BlankImagePageLayout.svelte';
    import type { Snippet } from 'svelte';

    interface Props {
        title?: string;
        children?: Snippet;
    }

    let { title = 'Error', children }: Props = $props();
</script>

<BlankImagePageLayout {title}>
    {@render children?.()}
</BlankImagePageLayout>
