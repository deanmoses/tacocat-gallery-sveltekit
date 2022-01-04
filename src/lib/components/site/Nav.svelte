<style>
  nav {
    display: flex;
    border-bottom: var(--default-border);
    background-color: var(--button-color);
  }
  :global(.btn:nth-child(2)) {
    border-left: 1px solid rgb(132, 132, 132);
	  border-right: 1px solid rgb(132, 132, 132);
  }
</style>

<nav role="navigation">
  <slot />
</nav>
