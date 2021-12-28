<header>
  <h1 class="hidden-xs"><slot name="title" /></h1>
  <h1 class="visible-xs"><slot name="short-title" /></h1>
</header>

<style>
  header {
    padding: var(--default-padding);
    background-color: #f7de5a;
    border: var(--default-border);
  }

  h1 {
    font-size: 28px;
  }
</style>
