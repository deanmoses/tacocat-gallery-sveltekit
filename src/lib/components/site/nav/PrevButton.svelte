<!--
  @component

  Button that navigates to the previous item
-->

<script lang="ts">
	import Button from "./Button.svelte";
	import PrevIcon from "../icons/PrevIcon.svelte";

	export let href: string = "";
	export let title: string = "";
</script>

<Button {href}><PrevIcon title="Previous" /><span class="hidden-xs">{title}</span></Button>
