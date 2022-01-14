<!--
  @component

  Button that navigates to the parent item
-->

<script lang="ts">
	import Button from "./Button.svelte";
	import HomeIcon from "../icons/HomeIcon.svelte";

	export let href = "";
	export let title = "";

	let a11yTitle: string;
	$: a11yTitle = title ? title : "Up";
</script>

<Button {href} title={a11yTitle}><HomeIcon /><span class="hidden-xs">{title}</span></Button>
