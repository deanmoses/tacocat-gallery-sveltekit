<!--
  @component

  Button that navigates to the next item
-->

<script lang="ts">
	import Button from "./Button.svelte";
	import NextIcon from "../icons/NextIcon.svelte";

  export let href: string = "";
  export let title: string = "";
</script>

<Button {href}><span class="hidden-xs">{title}</span><NextIcon title="Next"/></Button>