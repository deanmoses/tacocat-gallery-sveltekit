<style>
  .sidebar {
    flex: 1;
    min-width: 8em;
    padding: calc(var(--default-padding) * 2);
    padding-top: calc(var(--default-padding) * 4);
    background-color: #838470;
    border-right: var(--default-border);
  }
</style>

<div class="sidebar hidden-sm">
  <slot />
</div>
