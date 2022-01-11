import type { Album, Image, AlbumNavInfo, AlbumThumb } from '$lib/models/album';
import { ImageImpl } from '$lib/models/impl/image-impl';
import { getYearFromPath } from '$lib/utils/path-utils';

/**
 * Album implementation
 */
export class AlbumImpl implements Album {
	path: string;
	title?: string;
	customdata?: string;
	unpublished?: boolean;
	desc?: string;
	image_size?: number;
	thumb_size?: number;
	url_thumb?: string;
	date?: number;
	albums?: AlbumThumb[];
	images?: (Image)[];
	parent_album?: AlbumNavInfo;
	next?: AlbumNavInfo;
	prev?: AlbumNavInfo;

	constructor(path: string) {
		if (!(typeof path === 'string'))
			throw new Error('Album path must be a string');
		this.path = path;
	}

	/**
	 * Get year the album was published, like 2001
	 */
	get year(): number {
		// First look at the path: this lets us get the right color for the "Loading..." page
		// before we have the publication date
		const year = getYearFromPath(this.path);
		if (year) {
			return year;
		} else {
			// Else look at the publication date
			return new Date(this.date * 1000).getFullYear();
		}
	}

	/**
	 * Friendly title of page
	 */
	get pageTitle(): string {
		return this.title;
	}

	/**
	 * URL (including hashtag) to screen displaying album, like #2014/12-31
	 */
	get href(): string {
		return '/' + this.path;
	}

	/**
	 * Path of next album
	 * Blank if no next album
	 */
	get nextAlbumPath(): string {
		return this.next ? this.next.path : '';
	}

	/**
	 * URL to next album, including hash
	 * Blank if no next album
	 */
	get nextAlbumHref(): string {
		return this.next ? '/' + this.next.path : '';
	}

	/**
	 * Path of previous album
	 * Blank if no previous album
	 */
	get prevAlbumPath(): string {
		return this.prev ? this.prev.path : '';
	}

	/**
	 * URL to previous album, including hash
	 * Blank if no previous album
	 */
	get prevAlbumHref(): string {
		return this.prev ? '/' + this.prev.path : '';
	}

	/**
	 * URL to parent album, including hash
	 * Blank if no parent album
	 */
	get parentAlbumHref(): string {
		return this.parent_album ? '/' + this.parent_album.path : '';
	}

	/**
	 * Title of next album
	 * Blank if no next album
	 */
	get nextAlbumTitle(): string {
		return this.next ? this.next.title : '';
	}

	/**
	 * Title of previous album
	 * Blank if no previous album
	 */
	get prevAlbumTitle(): string {
		return this.prev ? this.prev.title : '';
	}

	/**
	 * Title of parent album
	 * Blank if no parent album
	 */
	get parentAlbumTitle(): string {
		return this.parent_album ? this.parent_album.title : '';
	}

	/**
	 * Return image at specified path, or null
	 */
	getImage(imagePath: string): Image {
		if (this.images) {
			const image = this.images.find((image: Image) => image.path === imagePath);
			if (image) {
				return Object.assign(new ImageImpl(this), image);
			}
		}
		return null;
	}
}
