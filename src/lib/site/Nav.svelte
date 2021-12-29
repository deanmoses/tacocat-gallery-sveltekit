<script>
  import PrevButton from "./PrevButton.svelte";
  import UpButton from "./UpButton.svelte";
  import NextButton from "./NextButton.svelte";
</script>

<style>
  nav {
    display: flex;
    border-left: var(--default-border);
    border-right: var(--default-border);
    border-bottom: var(--default-border);
  }
</style>

<nav role="navigation">
  <slot />
</nav>
