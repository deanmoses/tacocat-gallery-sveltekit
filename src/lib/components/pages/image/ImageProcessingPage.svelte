<!--
  @component
  
  Page that displays a loading indicator instead of an image
-->
<script lang="ts">
    import BlankImagePageLayout from './layouts/BlankImagePageLayout.svelte';
    import WaitingSpinner from '$lib/components/site/WaitingSpinner.svelte';

    interface Props {
        title: string;
    }

    let { title }: Props = $props();
</script>

<BlankImagePageLayout {title}>
    <p>{title}</p>
    <WaitingSpinner />
</BlankImagePageLayout>
