<style>
  nav {
      display: flex;
      background-color: var(--button-color);
  }

  :global(.btn:nth-child(2)) {
      border-left: 1px solid #ccc;
      border-right: 1px solid #ccc;
  }
</style>

<nav role="navigation">
  <slot />
</nav>