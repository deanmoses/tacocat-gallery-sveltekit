<div class="main-content">
  <slot />
</div>

<style>
  .main-content {
    flex: 3;

    display: flex;
    flex-direction: column;
    gap: calc(var(--default-padding) * 2);

    padding: calc(var(--default-padding) * 2);
    background-color: white;
  }

  @media (max-width: 456px) {
    .main-content {
      align-items: center;
      justify-content: center;
    }
  }
</style>
