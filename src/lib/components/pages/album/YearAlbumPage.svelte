<!--
  @component

  Page showing a year album
-->

<script lang="ts">
	import YearAlbumPageLayout from "./layouts/YearAlbumPageLayout.svelte";
	import Thumbnails from "$lib/components/site/Thumbnails.svelte";
	import Thumbnail from "$lib/components/site/Thumbnail.svelte";
	import PrevButton from "$lib/components/site/buttons/PrevButton.svelte";
	import UpButton from "$lib/components/site/buttons/UpButton.svelte";
	import NextButton from "$lib/components/site/buttons/NextButton.svelte";
	import {shortDate} from "$lib/utils/date-utils";
	import EditableHtml from "$lib/components/site/EditableHtml.svelte";

	export let album;
	export let year: string;

	let pageTitle = $album.pageTitle;

	/**
	 * Groups the child albums by month.
	 * Assumes passed-in albums are all within the same year.
	 */
	function albumsByMonth(albums) {
		// array to return
		let albumsByMonth = [];

		if (albums) {
			// month names to add to the results, to make rendering even simpler
			const monthNames = [
				'January',
				'February',
				'March',
				'April',
				'May',
				'June',
				'July',
				'August',
				'September',
				'October',
				'November',
				'December'
			];

			// iterate over the albums, putting them into the correct month
			albums.forEach(album => {
				// create Date object based on album's timestamp
				// multiply by 1000 to turn seconds into milliseconds
				const month: number = new Date(album.date * 1000).getMonth();
				if (!albumsByMonth[month]) {
					albumsByMonth[month] = {
						monthName: monthNames[month],
						albums: []
					};
				}
				albumsByMonth[month].albums.push(album);
			});
		}

		return albumsByMonth.reverse();
	}
</script>

<style>
  h3 {
    background-color: var(--header-color);
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

<YearAlbumPageLayout {year}>

	<svelte:fragment slot="nav">
		<PrevButton 
			href={$album.nextAlbumHref}
			title={$album.nextAlbumTitle}
		/>
		<UpButton href="../" title="All Years" />
		<NextButton
			href={$album.prevAlbumHref}
			title={$album.prevAlbumTitle}
		/>
	</svelte:fragment>

	<svelte:fragment slot="caption">
		<EditableHtml htmlContent={$album.desc}/>
	</svelte:fragment>

	<svelte:fragment slot="thumbnails">
		{#each albumsByMonth($album.albums) as month (month.monthName)}
			<section class="month">
				<h3>{month.monthName}</h3>
				<Thumbnails>
					{#each month.albums as childAlbum (childAlbum.path)}
						<Thumbnail
							title="{shortDate(childAlbum.date)}"
							summary="{childAlbum.customdata}"
							href="/{childAlbum.path}"
							src="https://cdn.tacocat.com{childAlbum.url_thumb}"
						/>
					{/each}
				</Thumbnails>
			</section>
		{/each}
	</svelte:fragment>

</YearAlbumPageLayout>