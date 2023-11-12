<!--
  @component  A year album's thumbnails by month
-->
<script lang="ts">
    import Thumbnails from '$lib/components/site/Thumbnails.svelte';
    import Thumbnail from '$lib/components/site/Thumbnail.svelte';
    import { shortDate } from '$lib/utils/date-utils';
    import { albumPathToDate } from '$lib/utils/galleryPathUtils';
    import type { Album } from '$lib/models/impl/GalleryItemInterfaces';
    import type { AlbumGalleryItem } from '$lib/models/server';

    export let album: Album;

    /**
     * Function to create URL to child album.
     * Needed to handle edit URLs.
     * If not passed in, uses default non-edit URL behavior
     */
    export let albumUrlCreator: (path: string | undefined) => string | undefined = (path) => {
        return path;
    };

    type AlbumsByMonth = Array<{
        monthName: string;
        albums: AlbumGalleryItem[];
    }>;

    /**
     * Group the albums by month
     */
    function albumsByMonth(albums: AlbumGalleryItem[]): AlbumsByMonth {
        // array to return
        let albumsByMonth: AlbumsByMonth = [];

        if (albums) {
            // iterate over the albums, putting them into the correct month
            albums.forEach((album) => {
                const albumPath = album.parentPath + album.itemName + '/';
                const albumDate = albumPathToDate(albumPath);
                const month: number = albumDate.getMonth();
                if (!albumsByMonth[month]) {
                    albumsByMonth[month] = {
                        monthName: albumDate.toLocaleString('default', { month: 'long' }),
                        albums: [],
                    };
                }
                albumsByMonth[month].albums.push(album);
            });
        }

        // remove empty months
        albumsByMonth = albumsByMonth.filter((month) => month);

        return albumsByMonth.reverse();
    }

    function getTitle(albumPath: string): string {
        const albumDate = albumPathToDate(albumPath);
        return shortDate(albumDate);
    }
</script>

{#each albumsByMonth(album.albums) as month (month.monthName)}
    <section class="month">
        <h3>{month.monthName}</h3>
        <Thumbnails>
            {#each month.albums as childAlbum (childAlbum.itemName)}
                <Thumbnail
                    title={getTitle(childAlbum.path)}
                    summary={childAlbum.summary}
                    href={albumUrlCreator(`${childAlbum.parentPath}${childAlbum.itemName}`)}
                    src="TODO"
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
