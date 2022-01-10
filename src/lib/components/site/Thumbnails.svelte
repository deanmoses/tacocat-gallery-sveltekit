<!--
  @component

  A grid of thumbnails
-->

<div>
  <slot />
</div>

<style>
  div {
    display: flex;
    flex-wrap: wrap;
    gap: calc(var(--default-padding) * 2);
  }
  @media (max-width: 456px) {
    div {
      justify-content: center;
    }
  }
</style>