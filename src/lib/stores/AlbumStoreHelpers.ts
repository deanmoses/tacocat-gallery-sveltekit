import RootAlbum from '$lib/models/album-root';
import { store } from '$lib/stores/store';
import { derived } from 'svelte/store';

export default {

    /**
     * Retrieve album from local store.  Does NOT fetch from server.
     * 
     * @returns album as a reactive Svelte store
     */
    getAlbum(path = "root") {
        return derived(
            store,
            $store => {
                // Create empty album if it doesn't exist locally
                if (!!$store.albums[path]) {
                    const realPath = path === "root" ? "" : path;
                    console.log(`getAlbum(${path}): need to set store here`);
                    //store.actions.setAlbum({"path":realPath});
                }
                return $store.albums[path]
            }
        );
    },

    /**
     * Fetch album from server
     * 
     * @returns Promise which returns no data.  Instead, the album returned by getAlbum() will be updated
     */
    async fetchAlbum(path = "root") {
        const uri = `https://tacocat.com/p_json/${path}.json`;
        const response = await fetch(uri);
        const json = await response.json();
        console.log(`fetchAlbum(${path}) fetched album:`, json.album);
        const jsonAlbum = json.album;
        const album = new RootAlbum(jsonAlbum.path);
        Object.assign(album, jsonAlbum);
        store.actions.setAlbum(album);
    }
}