import type { PageLoad } from './$types';
import { searchStore } from '$lib/stores/SearchStore';

export const load: PageLoad = ({ params, url }) => {
    const searchTerms = params.terms;
    const returnPath = url.searchParams.get('returnPath') ?? undefined;
    const oldestYear = toInt(url.searchParams.get('oldest'));
    const newestYear = toInt(url.searchParams.get('newest'));
    const oldestFirst = toBool(url.searchParams.get('oldestFirst'));
    return {
        returnPath,
        searchTerms,
        oldestYear,
        newestYear,
        oldestFirst,
        search: searchStore.get({ terms: searchTerms, oldestYear, newestYear, oldestFirst }),
    };
};

function toInt(s: string | null): number | undefined {
    return s ? parseInt(s, 10) : undefined;
}

function toBool(s: string | null): boolean {
    return s ? s.toLowerCase() === 'true' || s === '1' : false;
}
