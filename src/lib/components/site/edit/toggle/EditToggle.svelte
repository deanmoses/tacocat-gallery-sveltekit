<!--
  @component

  On hover, display a button to get into edit mode.  
	Only if current user is an admin.
-->

<script lang="ts">
    import { isAdmin } from '$lib/stores/SessionStore';
</script>

{#if $isAdmin}
    <!-- 
		Lazy load the actual component
		Do this async because it's a hint to the bundling system that 
		this code can be put into a separate bundle, so that non-admins
		aren't forced to load it.
	-->
    {#await import('./EditToggleInner.svelte') then c}
        <svelte:component this={c.default} />
    {/await}
{/if}
