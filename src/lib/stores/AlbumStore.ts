// I stole the initial code for this Immer-based Svelte store from this article:
// https://monad.fi/en/blog/svelte-custom-stores/
// ... whose git repo is here: 
// https://github.com/RikuVan/svelte-custom-stores-demo/tree/immer_store

import { writable } from 'svelte/store';
import produce from "immer";

const initialState = {
    // Key: album path like 2001/12-31
    // Value: an album in JSON format
    albums: {}
}

const actions = {
    setAlbum(state, album) {
        state.albums[album.path] = album;
    },
    setLatestAlbum(state, album) {
        const path = "latest";
        state.albums[path] = album;
    },
    setSearchResults(state, searchResults) {
        console.log(`setSearchResults(${searchResults.terms}): `, searchResults.results);
        const path = `search:${searchResults.terms}`;
        state.albums[path] = searchResults.results;
    },
    initAlbum(state, path) {
        if (state.albums[path] === undefined || state.albums[path] === null) {
            console.log(`initAlbum(${path}): initializing empty album`);
            state.albums[path] = {
                "path": path
            }
        }
    }
}

const immerActionsStore = (value, actions) => {
    const store = writable(value)
    const mappedActions = Object.keys(actions).reduce((acc, actionName) => {
        acc[actionName] = payload => store.update(state => produce(actions[actionName])(state, payload))
        return acc
    }, {})
    return {
        actions: mappedActions,
        subscribe: store.subscribe
    }
}

export const store = immerActionsStore(initialState, actions)