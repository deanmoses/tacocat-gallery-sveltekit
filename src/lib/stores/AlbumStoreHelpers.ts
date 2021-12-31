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
    fetchAlbum(): void {
        (async() => {
            try {
                const uri = "https://tacocat.com/p_json/2021.json";
                const response = await fetch(uri);
                const data = await response.json();
                console.log("fetchAlbum(): data: ", data);
                store.actions.setAlbum(data.album);
            }
            catch(e) {
                //$store.album.error = e;
            }
        })();
    }
}