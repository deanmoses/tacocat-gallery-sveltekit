<!--
  @component Sidebar of the site
-->

<div class="sidebar hidden-sm">
    <slot />
</div>

<style>
    .sidebar {
        flex: 1;
        min-width: 8em;
        padding: calc(var(--default-padding) * 4) calc(var(--default-padding) * 2);
        background-color: var(--sidebar-color);
        border-right: var(--default-border);
    }
</style>
