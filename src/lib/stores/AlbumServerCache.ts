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

	console.log(`TODO: album [${albumPath}] server JSON cache`);
	if (albumPath) return;

	// Configure the HTTP POST
	const requestConfig: RequestInit = {
		method: 'POST',
		headers: {
			Accept: 'application/json'
		},
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
