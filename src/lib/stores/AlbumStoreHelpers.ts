import createAlbumFromObject from '$lib/models/album-creator';
import type { Album, AlbumThumb } from '$lib/models/models';
import { store } from '$lib/stores/AlbumStore';
import Config from '$lib/utils/config';
import { derived } from 'svelte/store';
import type { Readable } from 'svelte/store';

export default {

    /**
     * Retrieve album from local store.  Does NOT fetch from server.
     * 
     * @returns album as a reactive Svelte store
     */
    getAlbum(path = ""): Readable<Album> {
        // Create empty album if it doesn't exist locally
        store.actions.initAlbum(path);
        return derived(
            store,
            $store => $store.albums[path]
        );
    },

    getLatestAlbum(): Readable<AlbumThumb>  {
        // Create empty album if it doesn't exist locally
        const path = "latest";
        // TODO: using initAlbum here is a hack, need an initLatestAlbum
        store.actions.initAlbum(path);
        return derived(
            store,
            $store => $store.albums[path]
        );
    },

    getSearchResults(searchTerms:string) {
        // Create search results if they don't exist locally
        const path = `search:${searchTerms}`;
        // TODO: using initAlbum here is a hack, need an initSearchResults
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
    async fetchAlbum(path = ""): Promise<void> {
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
    async fetchLatestAlbum(): Promise<void> {
        const uri = Config.latestAlbumUrl();
        const response = await fetch(uri);
        const json = await response.json();
        // TODO: better error handling if we don't get back expected response
	    // This will happen for sure if the gallery statistics plugin isn't enabled
        const latestAlbum: AlbumThumb = json.album.stats.album.latest[0] as AlbumThumb;
        console.log(`fetchLatestAlbum() fetched:`, latestAlbum);
        store.actions.setLatestAlbum(latestAlbum);
    },

    /**
     * Fetch search results from the server
     */
    async fetchSearchResults(searchTerms:string): Promise<void> {
        const uri = Config.searchUrl(searchTerms);
        const response = await fetch(uri);
        const json = await response.json();
        const searchResults = {
            terms: searchTerms,
            results: json.search
        };
        console.log(`fetchSearchResults(${searchTerms}) fetched:`, searchResults);
        store.actions.setSearchResults(searchResults);
    }
}