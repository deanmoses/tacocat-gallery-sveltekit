<script lang="ts">
    import '$lib/styles/reset.css';
    import '$lib/styles/global.css';
    import '$lib/styles/years.css';

    import { handleKeyboardNavigation } from '$lib/utils/keyboard-navigation';
    import { page } from '$app/state';
    import { goto } from '$app/navigation';
    import { albumStore } from '$lib/stores/AlbumStore';
    import type { Album } from '$lib/models/GalleryItemInterfaces';
    import { isAdmin } from '$lib/stores/SessionStore';
    import type { Snippet } from 'svelte';

    interface Props {
        children?: Snippet;
    }

    let { children }: Props = $props();

    /**
     * Handle keyboard navigation
     */
    function onKeyPress(event: KeyboardEvent): void {
        if (event.defaultPrevented) {
            return;
        }

        let currentPath = page.url.pathname;
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

{@render children?.()}
{#if $isAdmin}
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
<svelte:window onkeydown={onKeyPress} />
