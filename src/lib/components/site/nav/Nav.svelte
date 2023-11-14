<!--
  @component For grouping a set of navigation buttons together
-->

<nav>
    <slot />
</nav>

<style>
    nav {
        display: flex;
    }

    :global(.btn:nth-child(2)) {
        border-left: 1px solid #848484;
        border-right: 1px solid #848484;
    }
</style>
