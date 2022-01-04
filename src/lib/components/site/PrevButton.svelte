<script lang="ts">
  import Button from "./Button.svelte";

  export let href: string = "";
  export let title: string = "";
</script>

<Button {href}
  ><svg style="width: 1em; height: 1em;" viewBox="0 0 749 1102">
    <title>Previous</title>
    <path
      style="fill: currentcolor;"
      d="M749 198L397 551l352 353-197 198L0 550 552 0z"
    />
  </svg><span class="hidden-xs">{title}</span></Button
>
