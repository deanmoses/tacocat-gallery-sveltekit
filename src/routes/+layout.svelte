<script lang="ts">
    import '$lib/styles/reset.css';
    import '$lib/styles/global.css';
    import '$lib/styles/years.css';

    import { handleKeyboardNavigation } from '$lib/utils/keyboard-navigation';
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    import type { Album } from '$lib/models/album';
    import { albumStore } from '$lib/stores/AlbumStore';

    /**
     * Handle keyboard navigation
     */
    function onKeyPress(event: KeyboardEvent): void {
        if (event.defaultPrevented) {
            return;
        }

        let currentPath = $page.url.pathname;
        if (!currentPath.startsWith('/edit')) {
            const newPath = handleKeyboardNavigation(event.key, currentPath, getAlbum);
            if (newPath) {
                goto(newPath);
            }
        }
    }

    /**
     * Get album from store
     *
     * @param path path to album
     */
    function getAlbum(path: string): Album | undefined {
        return albumStore.getFromInMemory(path)?.album ?? undefined;
    }
</script>

<slot />

<svelte:window on:keydown={onKeyPress} />
