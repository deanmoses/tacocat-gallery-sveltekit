<!--
  @component Page that displays an error instead of an image
-->
<script lang="ts">
    import BlankImagePageLayout from './layouts/BlankImagePageLayout.svelte';

    export let title = 'Error';
</script>

<BlankImagePageLayout {title}>
    <slot />
</BlankImagePageLayout>
