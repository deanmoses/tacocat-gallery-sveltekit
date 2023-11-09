import type { PageLoad } from './$types';

export const load: PageLoad = ({ url }) => {
    const returnPath = url.searchParams.get('returnPath') ?? undefined;

    return {
        returnPath,
    };
};
