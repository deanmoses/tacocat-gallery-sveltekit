import type { PageLoad } from './$types';
import { searchStore } from '$lib/stores/SearchStore';
import type { SearchQuery } from '$lib/models/search';

export const load: PageLoad = ({ params, url }) => {
    const query: SearchQuery = {
        terms: params.terms,
        oldestYear: toInt(url.searchParams.get('oldest')),
        newestYear: toInt(url.searchParams.get('newest')),
        oldestFirst: toBool(url.searchParams.get('oldestFirst')),
    };
    return {
        returnPath: url.searchParams.get('returnPath') ?? undefined,
        query,
        search: searchStore.get(query),
    };
};

function toInt(s: string | null): number | undefined {
    return s ? parseInt(s, 10) : undefined;
}

function toBool(s: string | null): boolean {
    return s ? s.toLowerCase() === 'true' || s === '1' : false;
}
