<script>
	import AlbumErrorPage from "$lib/components/pages/album/AlbumErrorPage.svelte";
	import { isAdmin } from "$lib/stores/SessionStore";
</script>

{#if $isAdmin}
	<slot />
{:else}
	<AlbumErrorPage>
		You aren't authorized to access edit functionality
	</AlbumErrorPage>
{/if}