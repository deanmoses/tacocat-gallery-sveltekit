/**
 * A set of search results for a particular set of search terms
 */
export type Search = {
	results?: any;
	state?: SearchState;
	errorMessage?: string;
};

export enum SearchState {
	SEARCHING = 'SEARCHING',
	SUCCESS = 'SUCCESS',
	ERROR = 'ERROR'
};