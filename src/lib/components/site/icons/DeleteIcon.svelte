<!--
  @component 
  
  An icon representing the concept of "delete"
-->
<script lang="ts">
    import Icon from './Icon.svelte';

    interface Props {
        width?: string;
        height?: string;
        title?: string;
    }

    let { width = '0.85em', height = '1.2em', title = undefined }: Props = $props();

    const d =
        'M3.389 7.113L4.49 18.021c.061.461 2.287 1.977 5.51 1.979 3.225-.002 5.451-1.518 5.511-1.979l1.102-10.908C14.929 8.055 12.412 8.5 10 8.5c-2.41 0-4.928-.445-6.611-1.387zm9.779-5.603l-.859-.951C11.977.086 11.617 0 10.916 0H9.085c-.7 0-1.061.086-1.392.559l-.859.951C4.264 1.959 2.4 3.15 2.4 4.029v.17C2.4 5.746 5.803 7 10 7c4.198 0 7.601-1.254 7.601-2.801v-.17c0-.879-1.863-2.07-4.433-2.519zM12.07 4.34L11 3H9L7.932 4.34h-1.7s1.862-2.221 2.111-2.522c.19-.23.384-.318.636-.318h2.043c.253 0 .447.088.637.318.248.301 2.111 2.522 2.111 2.522h-1.7z';
    const viewBox = '0 0 20 15';
</script>

<Icon {width} {height} {viewBox} {title} {d} />
