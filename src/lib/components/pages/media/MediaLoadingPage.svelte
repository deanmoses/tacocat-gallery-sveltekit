<!--
  @component

  Page that displays a loading indicator instead of an image while the image is loading.
-->
<script lang="ts">
    import BlankMediaPageLayout from './layouts/BlankMediaPageLayout.svelte';
    import WaitingSpinner from '$lib/components/site/WaitingSpinner.svelte';
</script>

<BlankMediaPageLayout title="">
    <WaitingSpinner />
</BlankMediaPageLayout>
