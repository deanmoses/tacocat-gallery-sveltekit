# Testing Guide

## Layout

|               |                                                                        |
| ------------- | ---------------------------------------------------------------------- |
| Unit tests    | `src/**/*.spec.ts`, run by Vitest in node                              |
| Browser tests | `src/**/*.svelte.spec.ts`, run by Vitest in headless Chromium          |
| E2E tests     | `src/**/*.e2e.ts`, run by Playwright                                   |
| Commands      | `npm test` (quiet), `npm run test:unit` (verbose), `npm run test:e2e`  |
| Coverage      | `npm run test:coverage` to find gaps, `coverage/index.html` for detail |

`.svelte.` in a spec name means the spec itself compiles runes and needs the client build. Use the cheapest runtime that can run a test. A `Foo.svelte.ts` might get two files, `Foo.spec.ts` for transitions and `Foo.svelte.spec.ts` for reactivity. Testing `$effect` requires browser.

## Naming

**Give `describe` the function itself, not a string.**

```typescript
// ✅ Yes
describe(getMediaPath, …);

// ❌ No
describe('getMediaPath', …);

// ✅ A store's methods are not importable, so nest strings instead
describe('draftMachine', () => describe('init', …));
```

**Say what the code does, not what it "should" do.**

```typescript
// ✅ Yes
it('returns false for HEIC files', …);

// ❌ No
it('should return false...', …);
```

**Name the behaviour, not its history.** `it('checks all uploads, not just the first (bug fix)')` means nothing to a reader who doesn't remember the bug.

## Table-driven tests

Anything with more than two or three examples belongs in a table, driven with `it.each`. **A table makes the gaps visible** — an empty cell is obvious in a way that a missing `it()` never is.

```typescript
type FormatCase = {
    uploadPath: string;
    …
};

const CASES: FormatCase[] = [ … ];

describe(getMediaPath, () => {
    it.each(CASES)('$uploadPath is stored as $mediaPath', ({ uploadPath, mediaPath }) => {
        expect(getMediaPath(uploadPath)).toBe(mediaPath);
    });
});
```

`fileFormats.spec.ts` is the worked example. Two things that are easy to get wrong:

- **One table, many functions.** Separate example sets are how a case ends up covered on one axis and not the other.
- **Derive rows from a shared constant** when one exists: the video rows come from `VIDEO_EXTENSIONS`, so a new extension inherits the contract. Derive the _rows_, never the _expectations_ — an expectation computed the way the code computes it asserts nothing.

## Fixtures

Shared fixtures live in `src/lib/test-support/`: the record builders and the canonical album paths. Spell a path out instead where the path is the subject rather than the setting.

Build them complete, so the compiler checks them too.

```typescript
// ✅ Yes — a new required field on the server types breaks one file
export function imageRecord(fields: Partial<ImageRecord> & Pick<ImageRecord, 'itemType'>): ImageRecord {
    return { ...BASE_MEDIA, ...fields };
}

// ❌ No — asserts a shape the server never sends, and keeps compiling
const record = { itemType: 'image', path: '/2024/01-01/photo.jpg' } as GalleryRecord;
```

Pass a factory only the fields the test is about; keep the rest in a shared constant. What varies between rows is what the test is saying.

## Mocking

```typescript
// ✅ URL.createObjectURL exists in Node, so replace just the method
vi.spyOn(URL, 'createObjectURL').mockImplementation(...);

// ✅ Image does not exist in Node at all
vi.stubGlobal('Image', FakeImage);

// ❌ replaces the whole global, URL constructor included, for every module
vi.stubGlobal('URL', { createObjectURL, revokeObjectURL });
```

**Let the fixture decide the outcome, not the mock.** A stub that always succeeds means the failure path is never tested, which is usually the path that matters. Key the outcome off the input:

```typescript
const CORRUPT = 'corrupt'; // a file named corrupt.jpg fails to decode

await validateMediaBatch([mediaItem('corrupt.jpg')]);
```

**Record what the mock was asked to do**, when the interaction is part of the contract: that every object URL created was released, or that an `<img>` was never pointed at a HEIC file.

`restoreMocks` and `unstubGlobals` are on in `vite.config.ts`; no `afterEach` needed.

## Comment the why, never the what

`expect(getDetailWidth(1024, 768)).toBe(1024)` already says what it does. It doesn't say that 1024 is the boundary and the comparison is inclusive. That's the comment worth writing.

## Check a test by breaking the code

A test earns its place by failing when the code is wrong. That is not the same as running the code — a suite can be green, fast, readable and prove almost nothing.

When you doubt a test earns its place, break the code on purpose: invert a comparison, delete a branch, change a constant. If the suite stays green, the test is decorative.

**One green run says nothing about a test that waits.** A race shows up as a pass most of the time by definition. Anything asynchronous is worth running twenty times before you believe it: `for i in $(seq 1 20); do npx vitest run --project node <spec>; done`.

## Finding out what the code does

`toMatchInlineSnapshot()` with no argument makes vitest write the actual value into the spec on the next run. Reach for it when the question is what the code returns rather than whether a test holds — it beats asserting a value you know is wrong to read the answer off the diff.

## Testing a store

Stores split into state transition methods and service methods (see `CLAUDE.md`), and the split matters for testing:

- **State transition methods** are synchronous and are the only way state changes. They need no mocking — runes work outside a component, so a `.svelte.ts` store can be imported and driven directly. Cover these first.
- **Service methods** are async and reach into the API and other stores. Covering them means standing those up: worth doing, but a different size of job. Say so in the file rather than leaving it looking overlooked.

Stores are exported as singletons, so a spec resets in `beforeEach` rather than constructing one. `DraftMachine.spec.ts` is the worked example.

## Waiting for fire-and-forget work

A state transition method starts its service work without awaiting it, so a spec has to wait before asserting on the result. **Wait on the end state, never on a span of time.**

```typescript
// ✅ Finishes as soon as the work lands, however long it took
await vi.waitFor(() => expect(loadStatus()).toBe(AlbumLoadStatus.LOADED));

// ❌ Encodes a guess about how many event-loop turns the work takes
await new Promise((resolve) => setTimeout(resolve, 0));
```

The guess is what rots. A single macrotask was enough to drain a disk read back when the disk was an in-memory map; once it became a real IndexedDB, an open plus a transaction outran it and the test failed about one run in six — green often enough to survive review and CI, which is the worst way for a test to be wrong. Nothing about the assertion looked stale, and that is the point: the assumption lived in the waiting, not in the assertion.

A fixed drain is sound in exactly one case — asserting that something **did not** happen. Arriving too early there can only pass when it should pass, so the failure mode is a false pass rather than a flake. Say so at the call site, because the next reader will not be able to tell the two uses apart.

## Standing in for the network and the disk

Neither exists in node, and both have a stand-in in `src/lib/test-support/`. `fakeServer()` replaces `fetch`, keyed by method and pathname, with `jsonResponse()`, `notFound()` and `serverError()` for the replies. `resetAlbumState()` and `seedLoadedAlbum()` handle the one `AlbumState` singleton every store writes to. Read their doc comments before reaching for them — the sharp edges are written down there.

IndexedDB needs no setup at all: `fake-indexeddb/auto` is a setup file for the node project, so `idb-keyval` itself runs. Drive the cache through `idb-keyval` directly.

`AlbumLoadMachine.spec.ts` is the worked example.

## End-to-End tests with Playwright

E2E specs run against a real deployment — localhost by default, staging or prod via `BASE_URL`. They walk real album data, so they cover integration and can't make claims about specific content.

Which locator API to use is settled by lint. The judgment it leaves you is when to fall back to `getByTestId`.

Use it only where the markup offers nothing a user could perceive. Here that is the thumbnail grid: a thumbnail is an unlabelled `<div>`, and its image is decorative (`alt=""`) inside an `aria-hidden` anchor, so `getByRole` cannot reach either. Both carry a testid. The media region and the Next link have real roles and accessible names, so neither does.

A testid on something that could carry a role or a label buys a passing test and leaves the markup no more navigable than it was.

`no-nth-methods` rules out `.first()` without saying what replaces it. Wait for the collection to be non-empty, then resolve it, so auto-waiting survives:

```typescript
const thumbnails = page.getByRole('main').getByTestId('thumbnail');
await expect(thumbnails).not.toHaveCount(0);
const [thumbnail] = await thumbnails.all();
```

The site is entirely client-rendered, so nothing is present on load and every assertion must wait. Waits are set once in `playwright.config.ts` — `expect.timeout` and `navigationTimeout` — rather than per assertion, so a new spec inherits them and an inline timeout means the spec has a reason.

Shared e2e helpers live in `src/lib/test-support/e2e/`.

Wrap a journey in steps: walk through several pages in one test rather than several independent ones, because a later page is usually only reachable by arriving from the earlier one. `test.step` is then what says where it failed.

A failure leaves an HTML report in `playwright-report/`, trace included (`npx playwright show-report`). CI uploads it as an artifact, on green runs too: a test that only passed on its second attempt is the one worth opening.
