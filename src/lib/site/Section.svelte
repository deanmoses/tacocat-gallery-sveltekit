<script lang="ts">
  let clazz: string | null = null;
  export { clazz as class };
</script>

<style>
    h2 {
      display: none;
    }
</style>

<section class="{clazz}">
  <h2><slot name="title" /></h2>
  <slot/>
</section>