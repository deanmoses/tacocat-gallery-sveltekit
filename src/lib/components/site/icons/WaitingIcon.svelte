<!--
  @component
  
  An icon representing the concept of "wait"
-->
<script lang="ts">
    import Icon from './Icon.svelte';

    interface Props {
        title?: string;
        width?: string;
        height?: string;
    }

    let { title = undefined, width = '1em', height = '1em' }: Props = $props();

    const d =
        'M15.6 4.576V2.228C15.6 1.439 13.092 0 10 0 6.907 0 4.4 1.439 4.4 2.228v2.348C4.4 6.717 8.277 8.484 8.277 10c0 1.514-3.877 3.281-3.877 5.422v2.35C4.4 18.56 6.907 20 10 20c3.092 0 5.6-1.44 5.6-2.229v-2.35c0-2.141-3.877-3.908-3.877-5.422 0-1.515 3.877-3.282 3.877-5.423zM5.941 2.328c.696-.439 2-1.082 4.114-1.082 2.113 0 4.006 1.082 4.006 1.082.142.086.698.383.317.609-.838.497-2.478 1.02-4.378 1.02s-3.484-.576-4.324-1.074c-.381-.225.265-.555.265-.555zM10.501 10c0 1.193.996 1.961 2.051 2.986.771.748 1.826 1.773 1.826 2.435v1.328c-.97-.483-3.872-.955-3.872-2.504 0-.783-1.013-.783-1.013 0 0 1.549-2.902 2.021-3.872 2.504v-1.328c0-.662 1.056-1.688 1.826-2.435C8.502 11.961 9.498 11.193 9.498 10c0-1.193-.996-1.961-2.051-2.986-.771-.75-1.826-1.775-1.826-2.438l-.046-.998C6.601 4.131 8.227 4.656 10 4.656c1.772 0 3.406-.525 4.433-1.078l-.055.998c0 .662-1.056 1.688-1.826 2.438-1.054 1.025-2.051 1.793-2.051 2.986z';
    const viewBox = '0 0 20 20';
</script>

<Icon {viewBox} {title} {d} {width} {height} />
