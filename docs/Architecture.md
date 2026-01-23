# Architecture

## Basic Architecture

This is a single page app (SPA) built in SvelteKit and TypeScript. It does not use Sveltekit's server-side rendering; instead, the static browser-side files are deployed to a webserver. The webserver config is a separate project.

## The Back End is Elsewhere

This project only contains the static Single Page App (SPA) assets; the back end infrastructure for the app is contained in other projects. That includes:

- The hosting of this web app
- The back end photo management: photo storage, database, search, user management, image manipulation

## State Management

We use a state machine pattern for complex state management. The state machines are in `src/lib/stores/` and are organized by domain, such as:

- `AlbumState`: Manages album data and loading states
- `SessionStore`: Handles user session information
- `SearchStore`: Manages search state and results

Each state machine has clear separation between:

- _State Transition Methods_: These are the only public methods that can update state. They are synchronous and return void. They should return near-instantly.
- _Service Methods_: These are private methods that do the actual work (like making server calls). They are generally async and don't mutate state directly.
- _Other Methods_: Utility methods that don't fit the above categories.

We do not use a state machine library; we evaluated several of the front-runners and determined the download weight and complexity weren't worth it.

State is stored in \*.svelte.ts classes. These are compiled by Svelte and use Svelte 5's rune-based reactive state system with `$state` and `$derived`. We do NOT use Svelte stores.

For detailed patterns and code examples, see [Svelte 5 Patterns](Svelte.md#store-architecture).

## Data Caching Strategy

For retrieving albums and other data from the server, we use a Cache-Then-Network aka Stale-While-Revalidate pattern:

1. _Memory Cache_: The first layer is in-memory state. If data is already loaded in the application state, we return it immediately and then refresh in the background.

2. _Disk Cache_: If data isn't in memory, we check IndexedDB. If found, we return it immediately and then refresh in the background.

3. _Server Fetch_: In both cases above, we make a network request in the background to ensure data freshness.
    - On success, update the in-memory state first (prioritize showing new info to the user the fastest), then write to IndexedDB
    - On 404, remove it from all the caches.
    - On any other server error, keep the cached version.

This strategy ensures:

- Fast initial loads from cache
- Always-fresh data through background updates
- Some measure of offline capability / graceful degradation when network is unavailable

## User Model

- _End users_: the audience that uses this web app are unauthenticated guest users; we do not want people to have to manage logins.
- _Admins_: the administrators of the site, the people who upload images and edit albums, each get their own login.

## Lazy Loading

We want the unauthenticated guest experience to be as fast as possible. Therefore we use lazy loading techniques to ensure that guests don't download any of the admin code.

This often looks like this: `{#await import('$lib/components/site/admin/SomeAdminComponent.svelte') then { default: SomeAdminComponent }}`

## Hidden from Search Engines

The photos displayed through the app are personal in nature, and we do not want the wider internet to find them. However, we also don't want our audience to have to manage logins. Therefore, this app is designed to be publicly accessible yet NOT discoverable via Google and other search engines. This allows our unauthenticated guest users to use it, but casual searchers will not find it. Our users are notified of new albums via out-of-band mechanisms not discussed here.

We implement this by including `<meta name="robots" content="noindex" />` in every page view. This is more effective than the historical practice of using a robots.txt file.

Therefore, we do NOT care about Search Engine Optimization (SEO). Some features you might expect, like SEO-related meta tags, don't exist for this reason. Anything we can drop makes the app faster for end users.

## Browser Compatibility

- We ensure compatibility with major browsers (Chrome, Firefox, Safari) on both desktop and mobile.
- We ensure that any browser that hasn't been updated in two years still works. So HTML5, but not bleeding edge HTML5.
- We do NOT support Internet Explorer (IE).

## We Avoid Dependencies

We avoid dependencies whenever possible, especially runtime dependencies. We are very careful and parsimonious about adding new dependencies / libraries to the project. A library has to add a LOT of value to be worth it.

We avoid dependencies because:

- _Complexity_
    - Every dependency adds more moving parts to the system. More things to go stale / break with non-backwards-compatible updates, more subsystems to have to understand.
- _Weight_
    - Every dependency makes it heavier to download. In particular, we don't want to add weight for guest users. Speed is one of the most important virtues of this app.

If we _must_ add a dependency, we look for:

- _Zero sub-dependencies_
    - We go out of our way to use libraries that themselves don't have dependencies
- _Small size_
    - We prefer libraries with smaller bundled, minified size to client

## Speed is an Obsession

We prioritize a blazing fast user experience. Examples of choices we've made in support of this:

- We chose Svelte and Sveltekit in part because they have one of the lightest weight downloads of the major web application frameworks.
- The aforementioned ruthless elimination of dependencies.
- The aforementioned lazy loading of admin functionality.
- We've done extensive work to optimize the caching architecture: caching of the web app binaries, caching of API calls where appropriate, caching of images, etc
- It's not in this project, but our choices around databases, Content Delivery Networks (CDNs) and other back end infrastructure were driven in large part by performance considerations
