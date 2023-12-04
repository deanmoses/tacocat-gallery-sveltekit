<!--
  @component On hover, display edit buttons if user is an admin
-->
<script lang="ts">
    import { isAdmin } from '$lib/stores/SessionStore';
</script>

{#if $isAdmin}
    <!-- 
		Lazy / async / dynamic load this component.
		It's a hint to the bundling system that  this code 
        can be put into a separate bundle, so that non-admins
		aren't forced to load it.
	-->
    {#await import('./AdminToggleInner.svelte') then { default: AdminToggleInner }}
        <AdminToggleInner />
    {/await}
{/if}
