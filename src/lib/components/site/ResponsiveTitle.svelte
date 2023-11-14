<!--
  @component Displays different title-length text based on responsive breakpoints
-->
<script lang="ts">
    /** Normal length title */
    export let title: string;

    /** Short title */
    export let shortTitle: string;
</script>

{#if title && shortTitle}
    <span class="hidden-xs">{title}</span>
    <span class="visible-xs">{shortTitle}</span>
{:else if title}
    {title}
{/if}
