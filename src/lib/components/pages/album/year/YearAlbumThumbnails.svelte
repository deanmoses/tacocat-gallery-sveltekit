<!--
  @component

  A year album's thumbnails by month
-->
<script lang="ts">
    import Thumbnails from '$lib/components/site/Thumbnails.svelte';
    import AlbumThumbnail from '$lib/components/site/AlbumThumbnail.svelte';
    import { shortDate } from '$lib/utils/date-utils';
    import { albumPathToDate } from '$lib/utils/galleryPathUtils';
    import type { Album, Thumbable } from '$lib/models/GalleryItemInterfaces';

    interface Props {
        album: Album;
    }
    let { album }: Props = $props();

    type AlbumsByMonth = Array<{
        monthName: string;
        albums: Thumbable[];
    }>;

    /**
     * Group the albums by month
     */
    function albumsByMonth(albums: Thumbable[]): AlbumsByMonth {
        // array to return
        let albumsByMonth: AlbumsByMonth = [];

        if (albums) {
            // iterate over the albums, putting them into the correct month
            albums.forEach((album) => {
                const albumDate = albumPathToDate(album.path);
                const month: number = albumDate.getMonth();
                if (!albumsByMonth[month]) {
                    let monthName = albumDate.toLocaleString('default', { month: 'long' });
                    // capitalize the first letter
                    monthName = monthName.charAt(0).toUpperCase() + monthName.slice(1);
                    albumsByMonth[month] = {
                        monthName,
                        albums: [],
                    };
                }
                albumsByMonth[month].albums.unshift(album);
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
        <h2>{month.monthName}</h2>
        <Thumbnails>
            {#each month.albums as childAlbum (childAlbum.path)}
                <AlbumThumbnail
                    path={childAlbum.path}
                    href={childAlbum.href}
                    thumbnailUrlInfo={childAlbum.thumbnailUrlInfo}
                    title={getTitle(childAlbum.path)}
                    summary={childAlbum.summary}
                    published={childAlbum.published}
                />
            {/each}
        </Thumbnails>
    </section>
{/each}

<style>
    h2 {
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
