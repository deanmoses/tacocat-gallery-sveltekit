<!--
  @component

  Button that navigates to the parent item
-->

<script lang="ts">
	import Button from "./Button.svelte";
	import HomeIcon from "../icons/HomeIcon.svelte";

	export let href: string = "";
	export let title: string = "";
</script>

<Button {href}><HomeIcon /><span class="hidden-xs">{title}</span></Button>
