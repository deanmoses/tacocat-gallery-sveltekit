<!--
  @component

  On hover, display a button to get into edit mode.  
	Only if current user is an admin.
-->

<script lang="ts">
	import { isAdmin } from "$lib/stores/SessionStore";
	import EditToggleInner from "./EditToggleInner.svelte";
</script>

{#if $isAdmin}
	<EditToggleInner /> <!-- Maybe this should be loaded async, but it's so tiny it's not worth it -->
{/if}