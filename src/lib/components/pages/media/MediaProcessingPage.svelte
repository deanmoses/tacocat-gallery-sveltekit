<!--
  @component
  
  Page that displays a loading indicator instead of an image
-->
<script lang="ts">
    import BlankMediaPageLayout from './layouts/BlankMediaPageLayout.svelte';
    import WaitingSpinner from '$lib/components/site/WaitingSpinner.svelte';

    interface Props {
        title: string;
    }

    let { title }: Props = $props();
</script>

<BlankMediaPageLayout {title}>
    <p>{title}</p>
    <WaitingSpinner />
</BlankMediaPageLayout>
