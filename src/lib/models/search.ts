/**
 * A set of search results for a particular set of search terms
 */
export type Search = {
	results?: any;
	state?: SearchState;
};

export enum SearchState {
	SEARCHING = 'SEARCHING',
	SUCCESS = 'SUCCESS',
	ERROR = 'ERROR'
};