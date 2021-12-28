<script lang="ts">
  export let href: string | null = "";
  export let disabled: boolean | null;
</script>

<a class="btn" {href} {disabled}><slot /></a>

<style>
  .btn {
    flex: 1;

    display: flex;
    justify-content: center;
    align-items: center;
    column-gap: 0.2em;

    background-color: #cec68c;
    color: #333;
    border-color: #ccc;
    border: 1px solid transparent;
    text-decoration: none;
    padding-top: 0.2em;
    padding-bottom: 0.2em;
  }

  /* just nav buttons */
  .btn[disabled] {
    color: #ccc;
  }

  /* all buttons */
  .btn[disabled] {
    cursor: not-allowed;
    opacity: 0.65;
    box-shadow: none;
  }
</style>
