<script lang="ts">
    import Header from "$lib/site/Header.svelte";
    import Nav from "$lib/site/Nav.svelte";
    import PageContent from "$lib/site/PageContent.svelte";
    import Sidebar from "$lib/site/Sidebar.svelte";
    import MainContent from "$lib/site/MainContent.svelte";
    import Thumbnails from "$lib/site/Thumbnails.svelte";
    import Thumbnail from "$lib/site/Thumbnail.svelte";
    import PrevButton from "$lib/site/PrevButton.svelte";
    import UpButton from "$lib/site/UpButton.svelte";
    import NextButton from "$lib/site/NextButton.svelte";
    import type { Album } from "$lib/models/models";

    export let album = {};
    const months = childAlbumsByMonth($album.albums);

/**
 * Groups the child albums by month.
 * Assumes you are passing in an album whose subalbums are all within the same year.
 */
function childAlbumsByMonth(albums) {
	// array to return
	let childAlbumsByMonth = [];

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

		// iterate over this album's subalbums, putting them into the correct month
		albums.forEach(childAlbum => {
			// create Date object based on album's timestamp
			// multiply by 1000 to turn seconds into milliseconds
			const month: number = new Date(childAlbum.date * 1000).getMonth();
			if (!childAlbumsByMonth[month]) {
				childAlbumsByMonth[month] = {
					monthName: monthNames[month],
					albums: []
				};
			}
			childAlbumsByMonth[month].albums.push(childAlbum);
		});
	}

	return childAlbumsByMonth.reverse();
}
</script>

<style>
  h2 {
    display: none;
  }

  h3 {
    background-color: var(--header-color);
    font-weight: bold;
    font-size: 1.3em;
    line-height: 1.1;
    padding: 0.3em 0.4em;
    width: 100%;
  }

  .months {
    display: flex;
    flex-direction: column;
    gap: calc(var(--default-padding) * 2);
  }

  .month {
    display: flex;
    flex-direction: column;
    gap: calc(var(--default-padding) * 2);
  }
</style>

<svelte:head>
	<title>{$album.title}</title>
</svelte:head>

<Header>
  <span slot="title">{$album.title}</span>
</Header>
<Nav>
  <PrevButton title="2019" href="2019" />
  <UpButton title="All Years" href="../" />
  <NextButton disabled />
</Nav>
<PageContent>
  <Sidebar>
    {#if $album.desc}
    <section>
      <h2 style="display:none">Year In Review</h2>
      {$album.desc}
    </section>
    {/if}
  </Sidebar>
  <MainContent>
    <section class="months">
      <h2>Thumbnails</h2>
      {#each childAlbumsByMonth($album.albums) as month (month.monthName)}
        <section class="month">
          <h3>{month.monthName}</h3>
          <Thumbnails>
            {#each month.albums as childAlbum (childAlbum.path)}
              <Thumbnail
                title="{childAlbum.title}"
                summary="{childAlbum.customdata}"
                href="/{childAlbum.path}"
                src="https://cdn.tacocat.com{childAlbum.url_thumb}"
              />
            {/each}
          </Thumbnails>
        </section>
      {/each}
    </section>
  </MainContent>
</PageContent>