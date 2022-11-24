import type { PageLoad } from './$types';

export const load: PageLoad = ({ url }) => {
	const returnPath = url.searchParams.get('returnPath');

	return {
		returnPath
	};
}
