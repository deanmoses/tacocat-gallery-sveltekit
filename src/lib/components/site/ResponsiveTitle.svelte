<!--
  @component Displays different title-length text based on responsive breakpoints
-->
<script lang="ts">
    interface Props {
        /** Normal length title */
        title: string;
        /** Short title */
        shortTitle: string;
    }

    let { title, shortTitle }: Props = $props();
</script>

{#if title && shortTitle}
    <span class="hidden-xs">{title}</span>
    <span class="visible-xs">{shortTitle}</span>
{:else if title}
    {title}
{/if}
