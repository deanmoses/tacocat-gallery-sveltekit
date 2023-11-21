import type { PageLoad } from './$types';
import { getImage } from '$lib/stores/ImageStore';

export const load: PageLoad = ({ params }) => {
    const albumPath = `/${params.year}/${params.day}/`;
    const imagePath = `${albumPath}${params.image}`;
    const imageEntry = getImage(imagePath);
    return {
        imageEntry,
    };
};
