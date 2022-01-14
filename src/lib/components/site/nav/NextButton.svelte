<!--
  @component

  Button that navigates to the next item
-->

<script lang="ts">
	import Button from "./Button.svelte";
	import NextIcon from "../icons/NextIcon.svelte";

  export let href = "";
  export let title = "";

	let a11yTitle: string;
	$: a11yTitle = title ? title : "Next";
</script>

<Button {href} title={a11yTitle}><span class="hidden-xs">{title}</span><NextIcon /></Button>