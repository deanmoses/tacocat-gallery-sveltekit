<!--
  @component Layout of an image page for displaying waiting or error.
	         For use when you don't actually have an image to display.
-->
<script lang="ts">
    import ImagePageLayout from './ImagePageLayout.svelte';
    import PrevButton from '$lib/components/site/nav/PrevButton.svelte';
    import UpButton from '$lib/components/site/nav/UpButton.svelte';
    import NextButton from '$lib/components/site/nav/NextButton.svelte';
    import FullPageMessage from '$lib/components/site/FullPageMessage.svelte';

    export let title: string;
</script>

<ImagePageLayout {title}>
    <svelte:fragment slot="title">
        {title}
    </svelte:fragment>

    <svelte:fragment slot="nav">
        <PrevButton />
        <UpButton />
        <NextButton />
    </svelte:fragment>

    <svelte:fragment slot="image">
        <FullPageMessage>
            <slot />
        </FullPageMessage>
    </svelte:fragment>
</ImagePageLayout>
