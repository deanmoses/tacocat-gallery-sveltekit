/**
 * Svelte stores of search results
 */

import { writable, type Writable, derived, type Readable, get } from 'svelte/store';
import { produce } from 'immer';
import type { Search, SearchQuery, SearchResults } from '$lib/models/search';
import { SearchLoadStatus } from '$lib/models/search';
import toAlbum from '$lib/models/impl/AlbumCreator';
import { ImageThumbableImpl } from '$lib/models/impl/ImageThumbableImpl';
import { searchUrl } from '$lib/utils/config';
import { longDate } from '$lib/utils/date-utils';
import { albumPathToDate, getParentFromPath } from '$lib/utils/galleryPathUtils';
import type { AlbumRecord, GalleryRecord, ImageRecord } from '$lib/models/impl/server';
import type { Thumbable } from '$lib/models/GalleryItemInterfaces';

/**
 * Manages the Svelte stores of search results
 */
class SearchStore {
    /**
     * A set of Svelte stores holding search results
     */
    private searches: Map<SearchQuery, Writable<Search>> = new Map<SearchQuery, Writable<Search>>();

    /**
     * Get search results.
     *
     * This will:
     *
     * 1) Immediately return a Svelte store.
     * It will only have search results in it if was already requested
     * since the last page refresh.
     *
     * 2) And then it will async fetch a live version over the network.
     *
     * @returns a Svelte store
     */
    get(query: SearchQuery): Readable<Search> {
        // Remove any undefined keys, simply to make logging cleaner
        for (const key in query) {
            const k = key as keyof SearchQuery;
            if (query[k] === undefined) delete query[k];
        }
        // Get or create the writable version of the search
        const searchEntry = this.getOrCreateWritableStore(query);
        const status = get(searchEntry).status;
        // I don't have a copy in memory.  Go get it
        if (SearchLoadStatus.NOT_LOADED === status) {
            this.setLoadStatus(query, SearchLoadStatus.LOADING);
            this.fetchFromServer(query);
        }
        // Derive a read-only Svelte store over the search
        return derived(searchEntry, ($store) => $store);
    }

    /**
     * Get more results for an existing search
     *
     * @param startAt The number result from which to start fetching
     */
    getMore(query: SearchQuery, startAt: number): void {
        // Remove any undefined keys, simply to make logging cleaner
        for (const key in query) {
            const k = key as keyof SearchQuery;
            if (query[k] === undefined) delete query[k];
        }
        console.log(`Getting more results...`, query, startAt);
        this.getOrCreateWritableStore(query);
        this.setLoadStatus(query, SearchLoadStatus.LOADING_MORE_RESULTS);
        this.fetchFromServer(query, startAt);
    }

    /**
     * Fetch search results from server
     *
     * @param startAt The number result from which to start fetching
     */
    private fetchFromServer(query: SearchQuery, startAt: number = 0): void {
        const pageSize = 30;
        fetch(searchUrl(query, startAt, pageSize))
            .then((response: Response) => {
                if (!response.ok) {
                    throw new Error(response.statusText);
                }
                return response.json();
            })
            .then((json) => {
                console.log(`Search`, query, `fetched from server`, json);
                const searchResults = this.toSearchResults(json);
                console.log(`Transformed search results `, searchResults);
                if (startAt > 0) {
                    const read = this.searches.get(query);
                    if (read) {
                        const prev = get(read);
                        if (prev.results?.items && searchResults.items) {
                            console.log(
                                `Adding ${searchResults.items.length} new results to ${prev.results.items.length} existing results`,
                            );
                            searchResults.items = prev.results.items.concat(searchResults.items);
                        }
                    }
                }
                this.setSearch(query, searchResults); // Put search results in Svelte store
            })
            .catch((error) => {
                this.handleFetchError(query, error);
            });
    }

    private handleFetchError(query: SearchQuery, error: string): void {
        console.error(`Search error fetching from server: `, query, error);
        const status = this.getLoadStatus(query);
        switch (status) {
            case SearchLoadStatus.LOADING:
            case SearchLoadStatus.NOT_LOADED:
                this.setLoadStatus(query, SearchLoadStatus.ERROR_LOADING);
                break;
            case SearchLoadStatus.LOADING_MORE_RESULTS:
            case SearchLoadStatus.LOADED:
                this.setLoadStatus(query, SearchLoadStatus.ERROR_LOADING_MORE_RESULTS);
                break;
            case SearchLoadStatus.ERROR_LOADING:
                // already in correct state
                break;
            default:
                console.error('Unexepected load status:', status);
        }
    }

    /**
     * Store search results in Svelte store
     */
    private setSearch(query: SearchQuery, searchResults: SearchResults): void {
        const searchEntry = this.getOrCreateWritableStore(query);
        const newState = produce(get(searchEntry), (draftState: Search) => {
            draftState.status = SearchLoadStatus.LOADED;
            draftState.results = searchResults;
        });
        searchEntry.set(newState);
    }

    /**
     * Set the load status of the search
     */
    private setLoadStatus(query: SearchQuery, loadStatus: SearchLoadStatus): void {
        const searchEntry = this.getOrCreateWritableStore(query);
        const newState = produce(get(searchEntry), (draftState: Search) => {
            draftState.status = loadStatus;
        });
        searchEntry.set(newState);
    }

    private getLoadStatus(query: SearchQuery): SearchLoadStatus {
        const search = this.searches.get(query);
        return !!search ? get(search).status : SearchLoadStatus.NOT_LOADED;
    }

    /**
     * Get the private read-write version of the search,
     * creating a stand-in if it doesn't exist.
     *
     * @param query the search terms
     */
    private getOrCreateWritableStore(query: SearchQuery): Writable<Search> {
        let searchEntry = this.searches.get(query);

        // If the search wasn't found in memory
        if (!searchEntry) {
            console.log(`Search not found in memory `, query);
            // Create blank entry so that consumers have some object
            // to which they can subscribe to changes
            searchEntry = writable({
                status: SearchLoadStatus.NOT_LOADED,
            });
            this.searches.set(query, searchEntry);
        }

        return searchEntry;
    }

    /**
     * Transform from server JSON to a search results object
     *
     * @param json JSON object coming from server
     */
    private toSearchResults(json: ServerSearchResults): SearchResults {
        const items: GalleryRecord[] = json.items;
        return {
            total: json.total,
            items: items.map((i) => this.toThumbable(i)),
        };
    }

    private toThumbable(json: GalleryRecord): Thumbable {
        switch (json.itemType) {
            case 'album':
                return toAlbum(json as AlbumRecord);
            case 'image':
                return this.toImage(json as ImageRecord);
            default:
                throw new Error(`Unknown item type: ${json.itemType}`);
        }
    }

    private toImage(json: ImageRecord): ImageThumbableImpl {
        const image = new ImageThumbableImpl(json as any);
        image.summary = longDate(albumPathToDate(getParentFromPath(image.path)));
        return image;
    }
}

export const searchStore: SearchStore = new SearchStore();

type ServerSearchResults = {
    total: number;
    items: GalleryRecord[];
};
