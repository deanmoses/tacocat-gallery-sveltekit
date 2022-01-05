<!--
  @component

  The main content of a page.  In a photo page, that'd be the caption and photo.  In an album, the thumbnails.
-->

<style>
  .main-content {
    flex: 3;

    display: flex;
    flex-direction: column;
    gap: calc(var(--default-padding) * 2);

    padding: calc(var(--default-padding) * 2);
    background-color: white;
  }
</style>

<div class="main-content">
  <slot />
</div>
