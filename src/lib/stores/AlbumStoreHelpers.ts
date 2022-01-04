import createAlbumFromObject from '$lib/models/album-creator';
import type { AlbumThumb } from '$lib/models/models';
import { store } from '$lib/stores/store';
import Config from '$lib/utils/config';
import { derived } from 'svelte/store';

export default {

    /**
     * Retrieve album from local store.  Does NOT fetch from server.
     * 
     * @returns album as a reactive Svelte store
     */
    getAlbum(path = "root") {
        // Create empty album if it doesn't exist locally
        store.actions.initAlbum(path);
        return derived(
            store,
            $store => $store.albums[path]
        );
    },

    getLatestAlbum() {
        // Create empty album if it doesn't exist locally
        const path = "latest";
        store.actions.initAlbum(path);
        return derived(
            store,
            $store => $store.albums[path]
        );
    },

    /**
     * Fetch album from server
     * 
     * @returns Promise which returns no data.  Instead, the album returned by getAlbum() will be updated
     */
    async fetchAlbum(path = "root") {
        const uri = Config.albumUrl(path);
        const response = await fetch(uri);
        const json = await response.json();
        console.log(`fetchAlbum(${path}) fetched album:`, json.album);
        const jsonAlbum = json.album;
        const album = createAlbumFromObject(jsonAlbum);
        store.actions.setAlbum(album);
    },

    /**
     * Fetch latest album from server
     */
    async fetchLatestAlbum() {
        const uri = Config.latestAlbumUrl();
        const response = await fetch(uri);
        const json = await response.json();
        // TODO: better error handling if we don't get back expected response
	    // This will happen for sure if the gallery statistics plugin isn't enabled
        const latestAlbum: AlbumThumb = json.album.stats.album.latest[0] as AlbumThumb;
        console.log(`fetchLatestAlbum() fetched:`, latestAlbum);
        store.actions.setLatestAlbum(latestAlbum);
    }
}