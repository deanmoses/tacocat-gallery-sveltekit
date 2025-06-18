# Component Architecture & Patterns

We use Svelte 5 components and Sveltekit.

## Component Organization

The main categories of components are organized by folder:

1. **`/pages/`** - Page-level components that handle routing, UI states and loading the page's data

    - Organized by domain (album, image, search, admin)
    - Contains routing logic and loading/error states
    - Examples: `AlbumRouting.svelte`, `AlbumLoadingPage.svelte`

2. **`/site/`** - Reusable UI components that are composed into user experiences by the `/pages/`

    - Layout components (`SiteLayout.svelte`, `Header.svelte`)
    - Navigation components (`nav/` subdirectory)
    - Icon components (`icons/` subdirectory)
    - Admin-specific components (`admin/` subdirectory)
    - Except for the `admin/` components, these are **data-agnostic** by default, and do not interact with state machines

3. **`/data-aware/`** - Components that fetch their own data, rather than letting a page in '/pages/' do it
    - We want to keep these to an absolutely minimum. Do not add any more of these.
    - Examples: `LatestAlbumThumbnail.svelte`

## Key Architectural Patterns

### State Machine Integration

- Components are **data-agnostic** by default, except for the `admin/` components
- State machines handle all data fetching, caching, and state transitions
- Components consume state through reactive `$derived` expressions

### Snippet-Based Composition

- Uses Svelte 5's `Snippet` type for flexible component composition
- Components accept `children?: Snippet` for content injection
- Allows for dynamic content rendering with `{@render children?.()}`
- Enables flexible layouts without tight coupling

### Props Interface Pattern

- All components use TypeScript interfaces for props
- Props are destructured with `$props()` and default values
- Clear documentation of prop purposes in JSDoc comments
- Optional props with sensible defaults

### Status-Based Routing

- Page components use status-based conditional rendering
- Clear separation between loading, error, and success states
- Consistent error handling patterns across the application
- Examples: `AlbumRouting.svelte` handles all album states

### Admin/Guest Separation

- Guest users, who have read-only access to the app, are not made to download the admin functionality. Admin components are lazy-loaded via dynamic imports like `{#await import('$lib/components/site/admin/SomeAdminComponent.svelte') then { default: SomeAdminComponent }}`
- Admin functionality is isolated in `/site/admin/` directory

## Component Communication Patterns

### Parent-Child Communication

- Props down, events up pattern
- Snippets for flexible content injection
- No direct state manipulation in child components

### Cross-Component Communication

- State machines handle all cross-component communication
- Components react to state changes through `$derived`
- No direct component-to-component communication

### Admin Component Patterns

- Admin components integrate with specific state machines
- Edit controls use draft machines for temporary state
- Consistent patterns for edit/delete/create operations

## Styling Patterns

### CSS Custom Properties

- Uses CSS custom properties for theming (`--default-border`, `--header-color`)
- Consistent spacing and color variables
- Responsive design with utility classes (`hidden-sm`, `hidden-xs`)

### Component-Scoped Styles

- Each component has its own `<style>` block
- No global CSS pollution
- Consistent naming conventions

## Best Practices

1. **Single Responsibility**: Each component has a clear, focused purpose
2. **Composition over Inheritance**: Uses snippets and props for flexibility
3. **State Isolation**: Components don't directly manage complex state
4. **Performance**: Lazy loading of admin components
5. **Accessibility**: Proper alt text, semantic HTML
6. **Error Boundaries**: Clear error states and recovery paths

## Development Guidelines

- Use TypeScript interfaces for all props
- Document component purposes with JSDoc comments
- Use state machines for data management
- Implement proper loading and error states
- Components in the `/site/` directory should be composable and reusable

## Component Size Guidelines

Keep components brief. A component should do only one thing. Guidelines:

- **Small (10-25 lines)**: Icons, simple UI elements, loading states
- **Medium (26-50 lines)**: Standard components, simple layouts
- **Large (51-85 lines)**: Complex UI components, simple page components  
- **Extra Large (86-120 lines)**: Complex page components, admin components with forms
- **Review Threshold (120+ lines)**: Should be considered for refactoring

## Naming Conventions

### Component Files

- Use PascalCase for component file names: `Header.svelte`, `AlbumThumbnail.svelte`
- Use descriptive names that indicate the component's purpose
- Page components end with `Page.svelte`: `AlbumPage.svelte`, `SearchPage.svelte`
- Layout components end with `Layout.svelte`: `SiteLayout.svelte`, `AlbumPageLayout.svelte`
- Icon components end with `Icon.svelte`: `HomeIcon.svelte`, `SearchIcon.svelte`

### Props Interface

- Always name the props interface `Props`
- Use JSDoc comments to document each prop's purpose
- Use descriptive prop names that clearly indicate their function
- Use optional props with sensible defaults

### Component Documentation

- Start each component with a `@component` JSDoc comment
- Include a brief description of the component's purpose
- Example:

    ```typescript
    <!--
      @component

      Header of the site
    -->
    ```

### Variable Naming

- Use camelCase for variables and functions
- Use descriptive names that indicate purpose
- Use `$derived` for reactive expressions
- Use `$state` for component state

### CSS Classes

- Use kebab-case for CSS class names
- Use semantic class names that describe the element's purpose
- Use utility classes for common patterns (`hidden-sm`, `hidden-xs`)
- Use CSS custom properties for theming values
