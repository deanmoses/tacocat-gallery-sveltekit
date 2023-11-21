<!--
  @component Page that displays a loading indicator instead of an image
-->
<script lang="ts">
    import BlankImagePageLayout from './layouts/BlankImagePageLayout.svelte';
    import WaitingSpinner from '$lib/components/site/WaitingSpinner.svelte';
</script>

<BlankImagePageLayout title="">
    <WaitingSpinner />
</BlankImagePageLayout>
