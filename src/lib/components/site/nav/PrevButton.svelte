<!--
  @component

  Button that navigates to the previous item
-->

<script lang="ts">
	import Button from "./Button.svelte";
	import PrevIcon from "../icons/PrevIcon.svelte";

	export let href = "";
	export let title = "";

	let a11yTitle: string;
	$: a11yTitle = title ? title : "Previous";
</script>

<Button {href} title={a11yTitle}><PrevIcon /><span class="hidden-xs">{title}</span></Button>
