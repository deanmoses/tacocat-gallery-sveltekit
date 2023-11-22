<!--
  @component Base for all buttons on the edit control strip
-->
<script lang="ts">
    export let disabled: boolean = false;
</script>

<button on:click {disabled}><slot /></button>

<style>
    button {
        display: flex;
        align-items: center;
        gap: 0.3em;
    }
</style>
