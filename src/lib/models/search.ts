/**
 * A set of search results for a particular set of search terms
 */
export type Search = {
	status: SearchLoadStatus;
	results?: any;
};

/**
 * Status of the initial load of the search results
 */
export enum SearchLoadStatus {
	/** The search has not been searched for  */
	NOT_LOADED = 'NOT_LOADED',
	/** Searching is underway */
	LOADING = 'LOADING',
	/** There was an error searching */
	ERROR_LOADING = 'ERROR_LOADING',
	/** The search has been successfully loaded */
	LOADED = 'LOADED'
};

/**
 * Status of subsequent updates to the search results
 * 
 * Update status is different than load status: updates are AFTER the 
 * initial search has loaded.  You are refreshing the existing results.
 */
export enum SearchUpdateStatus {
	NOT_UPDATING = 'NOT_UPDATING',
	UPDATING = 'UPDATING',
	ERROR_UPDATING = 'ERROR_UPDATING'
};