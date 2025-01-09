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

  interface Props {
    title: string;
    children?: import('svelte').Snippet;
  }

  let { title, children }: Props = $props();
</script>

<ImagePageLayout {title}>
    <!-- @migration-task: migrate this slot by hand, `title` would shadow a prop on the parent component -->
  <svelte:fragment slot="title">
        {title}
    </svelte:fragment>

    {#snippet nav()}
  
          <PrevButton />
          <UpButton />
          <NextButton />
      
  {/snippet}

    {#snippet image()}
  
          <FullPageMessage>
              {@render children?.()}
          </FullPageMessage>
      
  {/snippet}
</ImagePageLayout>
