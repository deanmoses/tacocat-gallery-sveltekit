# Performance

Speed is a core value of this application. We prioritize a blazing fast user experience. Here's some of the things that support that.

## Framework & Build Optimizations

### Svelte & SvelteKit Choice

We chose Svelte & SvelteKit partly for its speed.

- **Lightweight framework**: Svelte has one of the smallest bundle sizes among major frameworks
- **Pre-deployment compilation**: Much work is done at build time, reducing runtime overhead
- **Static site generation**: Pre-built assets for fastest possible delivery
- **No server-side rendering**: Eliminates server processing time for guest users

### Bundle Optimization

- **Minimal dependencies**: Ruthless elimination of unnecessary libraries
- **Zero sub-dependencies**: Prefer libraries without their own dependencies
- **Small library size**: Choose libraries with fewer lines of code
- **Development vs production builds**: Optimized builds for deployment

## Lazy Loading Strategy

### Admin Component Lazy Loading

Guest users never download admin functionality, ensuring fast initial loads. Example:

```svelte
{#await import('$lib/components/site/admin/SomeAdminComponent.svelte') then { default: SomeAdminComponent }}
```

### Route-Level Lazy Loading

- **Edit pages**: Only loaded when admin functionality is needed
- **Upload components**: Loaded on-demand for file operations
- **Dialog components**: Loaded when user interactions require them

## Caching

### Data Caching Strategy

Albums and other data fetched from APIs are cached with a Cache-Then-Network aka Stale-While-Revalidate pattern:

1. **Memory Cache**: In-memory state for instant access
2. **Disk Cache**: IndexedDB write-through cache
3. **Server Fetch**: Background refresh for data freshness

### Service Worker Caching

- **Static assets caching**: All bundler-generated files are cached immediately
- **Image caching**: Images fetched and cached for offline use
- **Cache versioning**: Automatic cache invalidation on app updates
- **Selective caching**: Respects `no-store` cache headers for dynamic content

## SvelteKit Preloading

- **Hover preloading**: `data-sveltekit-preload-data="hover"` for faster navigation
- **Route preloading**: Pages load before user clicks
- **Background loading**: Non-blocking data fetching

## Development vs Production

### Build Variants

- **Development build**: `npm run build-debug` with source maps for debugging
- **Production build**: `npm run build` optimized and minified
- **Environment-specific caching**: Different strategies for dev vs prod

### Performance Monitoring

- **Bundle size monitoring**: Track bundle size with `npm run build`
- **Lazy loading effectiveness**: Monitor admin component loading
- **Cache hit rates**: Monitor service worker cache performance

## Performance Guidelines

### When Adding New Features

1. **Consider lazy loading**: Any feature that is only for admins MUST be lazy loaded
2. **Evaluate dependencies**: Is this library worth the bundle size?
3. **Test performance**: Measure impact on load times
4. **Cache appropriately**: Use the right caching strategy

### Performance Budgets

- **Initial bundle**: Keep under 100KB for guest users
- **Admin bundle**: Lazy load to avoid guest user impact
- **Image sizes**: Optimize thumbnails and full images
- **Cache efficiency**: Aim for >90% cache hit rate

### Monitoring Performance

- **Browser dev tools**: Use Performance tab for analysis
- **Bundle analysis**: Monitor bundle size changes
- **Network tab**: Check caching effectiveness
- **Lighthouse**: Regular performance audits
