/**
 * Svelte stores of search results
 */

import { writable, type Writable, derived, type Readable, get } from 'svelte/store';
import { produce } from 'immer';
import type { Search, SearchResults } from '$lib/models/search';
import { SearchLoadStatus, SearchUpdateStatus } from '$lib/models/search';
import toAlbum from '$lib/models/impl/AlbumCreator';
import { ImageThumbableImpl } from '$lib/models/impl/ImageThumbableImpl';
import { searchUrl } from '$lib/utils/config';
import { longDate } from '$lib/utils/date-utils';
import { albumPathToDate, getParentFromPath } from '$lib/utils/galleryPathUtils';
import type { AlbumRecord, GalleryRecord, ImageRecord } from '$lib/models/impl/server';

export type SearchQuery = {
    terms: string;
    oldestYear: number | undefined;
    newestYear: number | undefined;
    oldestFirst: boolean | undefined;
};

/**
 * Manages the Svelte stores of search results
 */
class SearchStore {
    /**
     * A set of Svelte stores holding search results
     */
    private searches: Map<SearchQuery, Writable<Search>> = new Map<SearchQuery, Writable<Search>>();

    /**
     * A set of Svelte stores holding the search update state
     *
     * Update status is different than load status: updates are AFTER the
     * initial search has loaded.  You are refreshing the existing results.
     */
    private SearchUpdateStatuses: Map<SearchQuery, Writable<SearchUpdateStatus>> = new Map<
        SearchQuery,
        Writable<SearchUpdateStatus>
    >();

    /**
     * Get search results.
     *
     * This will:
     *
     * 1) Immediately return a Svelte store.
     * It will only have search results in it if was already requested
     * since the last page refresh.
     *
     * 2) It'll then asynchronously look for a version cached on the
     * browser's local disk.
     *
     * 3) And then it will async fetch a live version over the network.
     *
     * @returns a Svelte store
     */
    get(query: SearchQuery, refetch = true): Readable<Search> {
        // Get or create the writable version of the search
        const searchEntry = this.getOrCreateWritableStore(query);

        const status = get(searchEntry).status;

        // I don't have a copy in memory.  Go get it
        if (SearchLoadStatus.NOT_LOADED === status) {
            this.setLoadStatus(query, SearchLoadStatus.LOADING);
            this.fetchFromServer(query);
        }
        // I have a copy in memory, but the caller has asked to re-fetch
        else if (refetch && SearchLoadStatus.LOADING !== status) {
            this.setUpdateStatus(query, SearchUpdateStatus.UPDATING);
            this.fetchFromServer(query);
        }

        // Derive a read-only Svelte store over the search
        return derived(searchEntry, ($store) => $store);
    }

    /**
     * Fetch search results from server
     */
    private fetchFromServer(query: SearchQuery): void {
        fetch(searchUrl(query))
            .then((response: Response) => {
                if (!response.ok) {
                    throw new Error(response.statusText);
                }
                return response.json();
            })
            .then((json) => {
                console.log(`Search [${query}] fetched from server`, json);
                const searchResults = this.toSearchResults(json);
                console.log(`Transformed search results `, searchResults);
                this.setSearch(query, searchResults); // Put search results in Svelte store
            })
            .catch((error) => {
                this.handleFetchError(query, error);
            });
    }

    private handleFetchError(query: SearchQuery, error: string): void {
        console.error(`Search [${query}] error fetching from server: `, error);
        const status = this.getLoadStatus(query);
        switch (status) {
            case SearchLoadStatus.LOADING:
            case SearchLoadStatus.NOT_LOADED:
                this.setLoadStatus(query, SearchLoadStatus.ERROR_LOADING);
                break;
            case SearchLoadStatus.LOADED:
                this.setUpdateStatus(query, SearchUpdateStatus.ERROR_UPDATING);
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

        this.setUpdateStatus(query, SearchUpdateStatus.NOT_UPDATING);
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

    private setUpdateStatus(query: SearchQuery, status: SearchUpdateStatus): void {
        console.log(`Search [${query}] set update status:`, status);
        const updateStatusStore = this.getOrCreateUpdateStatusStore(query);
        updateStatusStore.set(status);
    }

    /**
     * Get the private read-write Svelte store containing the search's update status,
     * creating it if it doesn't exist
     */
    private getOrCreateUpdateStatusStore(query: SearchQuery): Writable<SearchUpdateStatus> {
        let entryStore: Writable<SearchUpdateStatus> | undefined;
        entryStore = this.SearchUpdateStatuses.get(query);
        if (!entryStore) {
            const newEntry: SearchUpdateStatus = SearchUpdateStatus.NOT_UPDATING;
            entryStore = writable(newEntry);
        }
        this.SearchUpdateStatuses.set(query, entryStore);
        return entryStore;
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
            console.log(`Search [${query}] not found in memory`);
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
     * @param json JSON object coming from server or IDB
     */
    private toSearchResults(json: ServerSearchResults): SearchResults {
        const items: GalleryRecord[] = json.items;
        return {
            albums: items.filter((i) => i['itemType'] == 'album').map((i) => toAlbum(i as AlbumRecord)),
            images: items.filter((i) => i['itemType'] == 'image').map((i) => this.toImage(i as ImageRecord)),
        };
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
