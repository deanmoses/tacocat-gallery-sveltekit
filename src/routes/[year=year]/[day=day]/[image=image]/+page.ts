import type { PageLoad } from './$types';
import { getImage } from '$lib/stores/ImageStore';
import { getImageDeleteEntry } from '$lib/stores/ImageDeleteStore';

export const load: PageLoad = ({ params }) => {
    const albumPath = `/${params.year}/${params.day}/`;
    const imagePath = `${albumPath}${params.image}`;
    const imageEntry = getImage(imagePath);
    const deleteEntry = getImageDeleteEntry(imagePath);
    return {
        imageEntry,
        deleteEntry,
    };
};
