<section class="hidden-sm">
  <h2 role="heading" aria-level="2"><slot name="title" /></h2>
  <slot />
</section>

<style>
  section {
    flex: 1;
    min-width: 8em;
    padding: var(--default-padding);
    background-color: #838470;
    border-right: var(--default-border);
  }

  h2 {
    display: none;
  }
</style>
