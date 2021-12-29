<header>
  <h1 class="hidden-xs"><slot name="title" /></h1>
  <h1 class="visible-xs"><slot name="short-title" /></h1>
</header>

<style>
  header {
    padding: var(--default-padding);
    padding-left: calc(var(--default-padding) * 2);
    background-color: var(--header-color);
    border: var(--default-border);
  }

  h1 {
    font-size: 28px;
  }
</style>
