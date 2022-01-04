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

<div>
  <slot></slot>
</div>