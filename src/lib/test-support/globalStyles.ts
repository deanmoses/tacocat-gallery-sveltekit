/**
 * The site's stylesheet is imported by the root layout, which a component spec
 * never mounts. Without it a global rule such as `.hidden-sm` never applies,
 * and `toBeVisible()` passes on an element the site hides.
 */
import '$lib/styles/global.css';
