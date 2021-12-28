<section>
  <h2 role="heading" aria-level="2">Thumbnails</h2>
  <slot />
</section>

<style>
  section {
    flex: 3;
    gap: calc(var(--default-padding) * 2);
    padding: calc(var(--default-padding) * 2);
    background-color: white;
    display: flex;
    flex-wrap: wrap;
    align-content: flex-start;
  }

  @media (max-width: 456px) {
    section {
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }

  h2 {
    display: none;
  }
</style>
