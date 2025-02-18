<!--
  @component
  
  On hover, display edit buttons if user is an admin
-->
<script lang="ts">
    import { sessionStore } from '$lib/stores/SessionStore.svelte';
</script>

<!-- 
    Lazy / async / dynamic load this component.
    It's a hint to the bundling system that this code 
    can be put into a separate bundle, so that non-admins
    aren't forced to load it.
-->
{#if sessionStore.isAdmin}
    {#await import('./AdminToggleInner.svelte') then { default: AdminToggleInner }}
        <AdminToggleInner />
    {/await}
{:else if sessionStore.hasBeenLoggedIn}
    {#await import('./AdminLoginToggle.svelte') then { default: AdminLoginToggle }}
        <AdminLoginToggle />
    {/await}
{/if}
