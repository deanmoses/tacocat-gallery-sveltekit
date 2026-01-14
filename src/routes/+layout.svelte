<script lang="ts">
    import '$lib/styles/reset.css';
    import '$lib/styles/global.css';
    import '$lib/styles/years.css';
    import type { LayoutProps } from './$types';
    import { handleKeyboardNavigation } from '$lib/utils/keyboard-navigation';
    import { page } from '$app/state';
    import { goto } from '$app/navigation';
    import type { Album } from '$lib/models/GalleryItemInterfaces';
    import { sessionStore } from '$lib/stores/SessionStore.svelte';
    import { albumState } from '$lib/stores/AlbumState.svelte';

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
{#if sessionStore.isAdmin || sessionStore.hasBeenLoggedIn}
    <!--
        Toast component for admin notifications.
        Uses hasBeenLoggedIn so toasts remain visible even after logout
        (e.g., "session expired" errors). Lazy loaded so users who have
        never logged in don't pay the bundle cost.
    -->
    {#await import('@zerodevx/svelte-toast') then { SvelteToast }}
        <SvelteToast />
    {/await}
{/if}
<svelte:window {onkeydown} />
