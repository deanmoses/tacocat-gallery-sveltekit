<script lang="ts">
    import '$lib/styles/reset.css';
    import '$lib/styles/global.css';
    import '$lib/styles/years.css';
    import type { LayoutProps } from './$types';
    import { handleKeyboardNavigation } from '$lib/utils/keyboard-navigation';
    import { page } from '$app/state';
    import { goto } from '$app/navigation';
    import type { Album } from '$lib/models/GalleryItemInterfaces';
    import { sessionStore } from '$lib/state/SessionStore.svelte';
    import { albumState } from '$lib/state/AlbumState.svelte';

    let { children }: LayoutProps = $props();

    /**
     * Handle keyboard navigation
     */
    function onkeydown(event: KeyboardEvent): void {
        if (event.defaultPrevented) return;
        if (albumState.editMode) return; // in edit mode, arrow keys are needed for editing

        let currentPath = page.url.pathname;
        const newPath = handleKeyboardNavigation(event.key, currentPath, getAlbum);
        if (newPath) goto(newPath);
    }

    /**
     * Get album from store
     *
     * @param path path to album
     */
    function getAlbum(path: string): Album | undefined {
        return albumState.albums.get(path)?.album;
    }
</script>

{@render children?.()}
{#if sessionStore.isAdmin}
    <!-- 
		Lazy / async / dynamic load this component.
		It's a hint to the bundling system that this code 
        can be put into a separate bundle, so that non-admins
		aren't forced to load it.
	-->
    {#await import('@zerodevx/svelte-toast') then { SvelteToast }}
        <SvelteToast />
    {/await}
{/if}
<svelte:window {onkeydown} />
