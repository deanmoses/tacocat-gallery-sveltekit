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
};

/**
 * Status of the initial load of the search results
 */
export const SearchLoadStatus = {
    NOT_LOADED: 'NOT_LOADED',
    LOADING: 'LOADING',
    LOADING_MORE_RESULTS: 'LOADING_MORE_RESULTS',
    ERROR_LOADING: 'ERROR_LOADING',
    ERROR_LOADING_MORE_RESULTS: 'ERROR_LOADING_MORE_RESULTS',
    LOADED: 'LOADED',
} as const;

export type SearchLoadStatus = typeof SearchLoadStatus[keyof typeof SearchLoadStatus];
