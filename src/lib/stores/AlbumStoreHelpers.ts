import RootAlbum from '$lib/models/album-root';
import { store } from '$lib/stores/store';
import { derived } from 'svelte/store';

export default {

    /**
     * Retrieve album from local store.  Does not fetch from server.
     * 
     * @returns album as a reactive Svelte store
     */
    getAlbum() {
        return derived(
            store,
            $store => $store.album
        );
    },

    /**
     * Fetch album from server
     * 
     * @returns nothing.  The album returned by getAlbum() will be updated
     */
    fetchAlbum(path = "root"): void {
        (async() => {
            try {
                const uri = `https://tacocat.com/p_json/${path}.json`;
                const response = await fetch(uri);
                const json = await response.json();
                console.log(`fetchAlbum(${path}) fetched album:`, json.album);
                const jsonAlbum = json.album;
                const album = new RootAlbum(jsonAlbum.path);
                Object.assign(album, jsonAlbum);
                store.actions.setAlbum(album);
            }
            catch(e) {
                //$store.album.error = e;
            }
        })();
    }
}