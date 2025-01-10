<script lang="ts">
    interface Props {
        children?: import('svelte').Snippet;
    }

    let { children }: Props = $props();
</script>

<!--
  @component A grid of thumbnails
-->

<div>
    {@render children?.()}
</div>

<style>
    div {
        display: flex;
        flex-wrap: wrap;
        gap: calc(var(--default-padding) * 2);
    }
    @media (max-width: 456px) {
        div {
            justify-content: center;
        }
    }
</style>
