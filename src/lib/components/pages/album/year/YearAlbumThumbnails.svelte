<!--
  @component

  A year album's thumbnails by month
-->

<script lang="ts">
	import Thumbnails from "$lib/components/site/Thumbnails.svelte";
	import Thumbnail from "$lib/components/site/Thumbnail.svelte";
	import {shortDate} from "$lib/utils/date-utils";
	import type { Album } from '$lib/models/album';
	import Config from "$lib/utils/config";

	export let album: Album;

	type AlbumsByMonth = Array<{
		monthName: string, 
		albums: Album[]
	}>;

	/**
	 * Group the albums by month
	 */
	function albumsByMonth(albums: Album[]): AlbumsByMonth {
		// array to return
		let albumsByMonth: AlbumsByMonth = [];

		if (albums) {
			// iterate over the albums, putting them into the correct month
			albums.forEach(album => {
				const albumDate = new Date(album.date * 1000);
				const month: number = albumDate.getMonth();
				if (!albumsByMonth[month]) {
					albumsByMonth[month] = {
						monthName: albumDate.toLocaleString('default', { month: 'long' }),
						albums: []
					};
				}
				albumsByMonth[month].albums.push(album);
			});
		}

		// remove empty months
		albumsByMonth = albumsByMonth.filter(month => month);

		return albumsByMonth.reverse();
	}
</script>

{#each albumsByMonth(album.albums) as month (month.monthName)}
	<section class="month">
		<h3>{month.monthName}</h3>
		<Thumbnails>
			{#each month.albums as childAlbum (childAlbum.path)}
				<Thumbnail
					title={shortDate(childAlbum.date)}
					summary={childAlbum.customdata}
					href="/{childAlbum.path}"
					src={Config.cdnUrl(childAlbum.url_thumb)}
				/>
			{/each}
		</Thumbnails>
	</section>
{/each}

<style>
  h3 {
    background-color: var(--month-color, var(--header-color));
    font-weight: bold;
    font-size: 1.3em;
    line-height: 1.1;
    padding: 0.3em 0.4em;
    width: 100%;
  }

  .month {
    display: flex;
    flex-direction: column;
    gap: calc(var(--default-padding) * 2);
  }
</style>