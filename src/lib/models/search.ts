import type { Thumbable } from './GalleryItemInterfaces';

/**
 * Search querty to send to server
 */
export type SearchQuery = {
    terms: string;
    oldestYear?: number;
    newestYear?: number;
    oldestFirst?: boolean;
};

/**
 * An in-progress search
 */
export type Search = {
    status: SearchLoadStatus;
    results?: SearchResults;
};

/**
 * Search results
 */
export type SearchResults = {
    /** Total # of results in gallery, not this specific set of results */
    total: number;
    items?: Thumbable[];
    /** Next offset to use for pagination (based on server response, not filtered items) */
    nextStartAt?: number;
};

/**
 * Status of the initial load of the search results
 */
export enum SearchLoadStatus {
    /** The search has not been searched for  */
    NOT_LOADED = 'NOT_LOADED',
    /** Searching is underway */
    LOADING = 'LOADING',
    /** Retrieving more results is underway */
    LOADING_MORE_RESULTS = 'LOADING_MORE_RESULTS',
    /** There was an error searching */
    ERROR_LOADING = 'ERROR_LOADING',
    /** There was an error loading additional results */
    ERROR_LOADING_MORE_RESULTS = 'ERROR_LOADING_MORE_RESULTS',
    /** The search has been successfully loaded */
    LOADED = 'LOADED',
}
