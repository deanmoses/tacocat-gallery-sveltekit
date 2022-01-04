<script lang="ts">
  export let href: string = "";

  $: disabled  = !href ? '' : null;
</script>

<style>
  .btn {
    flex: 1;

    display: flex;
    justify-content: center;
    align-items: center;
    column-gap: 0.2em;

    /*background-color: #cec68c;*/
    color: #333;
    border: 1px solid #ccc;
    text-decoration: none;
    padding: 6px 12px;
  }

  .btn[disabled] {
    color: #ccc;
    cursor: not-allowed;
    /*opacity: 0.65;*/
    background-color: var(--button-disabled-color);
  }
</style>

<a class="btn" {href} {disabled}><slot /></a>