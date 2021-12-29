<script lang="ts">
  import Section from "./Section.svelte";
</script>

<style>
  :global(.thumbnails) {
    display: flex;
    flex-wrap: wrap;
    gap: calc(var(--default-padding) * 2);
  }
  @media (max-width: 456px) {
    :global(.thumbnails) {
      justify-content: center;
    }
  }
</style>

<Section class="thumbnails">
  <span slot="title">Thumbnails</span>
  <slot>thumbnails</slot>
</Section>  