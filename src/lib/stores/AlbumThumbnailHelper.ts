import { store } from '$lib/stores/AlbumStore';


/**
 * Set specified thumbnail as specified album's thumbnail
 *
 * @param albumPath path of album I'm setting the thumbnail on
 * @param thumbnailLeafPath leaf path of the thumbnail item, like 'felix.jpg'
 */
export async function setAlbumThumbnail(albumPath: string, thumbnailLeafPath: string): Promise<void> {
	console.log(`TODO: save thumbnail ${thumbnailLeafPath}) on album ${albumPath}`);

	// Simulate a save
	await timeout(1000);

	console.log(`Finished fake save of thumbnail ${thumbnailLeafPath}) on album ${albumPath}`);

	// Update thumb on cached version of album
	// TODO: this is where Redux is great. Here I should just fire a THUMB_UPDATED action
	// and another part of the system takes care of updating the album
	const payload = { 
		albumPath, 
		thumbnailUrl: thumbnailLeafPath 
	}
	store.actions.setThumbnail(payload);
}

function timeout(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}