/**
 * Error for fetching from server
 */
 export interface FetchError {
	/**
	 * Suitable for display to end user
	 */
	message: string;

	/**
	 * Type of error
	 */
	type: FetchErrorType;
};

/**
 * Types of errors that fetching from server can generate
 */
export enum FetchErrorType {
	NotFound = 'NotFound',
	Other = 'Other'
};

export class FetchErrorImpl implements FetchError {
	message: string;
	type: FetchErrorType;

	constructor(message: string, type?: FetchErrorType) {
		this.message = message;
		this.type = type ? type : FetchErrorType.Other;
	}
};