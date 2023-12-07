<!--
  @component Base for all buttons on the edit control strip
-->
<script lang="ts">
    export let disabled: boolean = false;
    /** Alt text*/
    export let title: string | undefined = undefined;
</script>

<button on:click {disabled} {title} type="button"><slot /></button>

<style>
    button {
        display: flex;
        align-items: center;
        gap: 0.3em;
    }
</style>
