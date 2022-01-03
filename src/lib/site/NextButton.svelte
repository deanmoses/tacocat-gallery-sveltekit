<script lang="ts">
  import Button from "./Button.svelte";

  export let href: string = "";
  export let title: string = "";
</script>

<Button {href}
  ><span class="hidden-xs">{title}</span><svg
    class="icon"
    style="width: 1em; height: 1em;"
    viewBox="0 0 749 1102"
  >
    <title>Next</title>
    <path
      style="fill: currentcolor;"
      d="M749 551l-551 551L0 904l353-353L0 198 198 0z"
    />
  </svg></Button
>
