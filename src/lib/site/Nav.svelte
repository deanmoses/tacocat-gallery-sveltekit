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
  :global(.btn:nth-child(2)) {
    border-left: 1px solid rgb(132, 132, 132);
	  border-right: 1px solid rgb(132, 132, 132);
  }
</style>

<nav role="navigation">
  <slot />
</nav>
