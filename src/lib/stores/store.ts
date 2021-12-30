// I stole the initial code for this Immer-based Svelte store from this article:
// https://monad.fi/en/blog/svelte-custom-stores/
// ... whose git repo is here: 
// https://github.com/RikuVan/svelte-custom-stores-demo/blob/immer_store/package.json

import { writable } from 'svelte/store';
import produce from "immer";

const initialState = {
    album : {
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
    show(state) {
        state.visible = true
    },
    hide(state) {
        state.visible = false
    },
    inc(state) {
        state.dogs++
    },
    dec(state) {
        if (state.dogs > 0) state.dogs--
    },
    setDate(state, date: Date) {
        state.album.date = date;
    },
    setLoaded(state) {
        state.album.isLoading = false;
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