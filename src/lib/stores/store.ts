// I stole the initial code for this Immer-based Svelte store from this article:
// https://monad.fi/en/blog/svelte-custom-stores/
// ... whose git repo is here: 
// https://github.com/RikuVan/svelte-custom-stores-demo/blob/immer_store/package.json

import { writable } from 'svelte/store';
import produce from "immer";

const initialState = {
    // Key: album path like 2001/12-31
    // Value: an album in JSON format
    albums: {},
    album: {
        year: "2000",
        title: "Awesome Title",
        date: new Date(),
        isLoading: true
    },
    visible: false,
    dogs: 0
}

const actions = {
    reset() {
        return initialState
    },
    setDate(state, date: Date) {
        state.album.date = date;
    },
    setLoading(state) {
        state.album.isLoading = true;
    },
    setAlbum(state, album) {
        album.isLoading = false;
        state.album = album;
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