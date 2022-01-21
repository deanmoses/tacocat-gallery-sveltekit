//
// This is not a store, but a helper method used by several stores
//

import Config from "$lib/utils/config";

/**
 * Update the album's cached JSON file on the server
 * 
 * @param albumPath path of the album
 */
export function updateAlbumServerCache(albumPath: string): void {

	// Configure the HTTP POST
	const requestConfig: RequestInit = {
		method: 'POST',
		headers: {
			Accept: 'application/json'
		},
		// no-store: bypass the HTTP cache completely.  
		// This will make the browser not look into the HTTP cache 
		// on the way to the network, and never store the resulting 
		// response in the HTTP cache.
		// Fetch() will behave as if no HTTP cache exists.
		cache: 'no-store'
	};

	fetch(Config.refreshAlbumCacheUrl(albumPath), requestConfig)
		.then(response => {
			if (response.status !== 200)
				throw new Error('Error fetching: ' + response.statusText);
			return response;
		})
		.then(response => response.json())
		.then(json => {
			if (json.status !== 'success')
				throw new Error('Error refreshing cache for album ${albumPath}');
		})
		.then(() => {
			console.log(`Success refreshing cache for album ${albumPath}`);
		})
		.catch(error => {
			console.log(error);
		});
}
