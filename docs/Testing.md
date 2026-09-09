# Testing Guide

## Layout

|            |                                                                        |
| ---------- | ---------------------------------------------------------------------- |
| Unit tests | `src/**/*.spec.ts`, beside the module they cover                       |
| E2E tests  | `tests/*.spec.ts`, run by Playwright                                   |
| Commands   | `npm test` (quiet), `npm run test:unit` (verbose), `npm run test:e2e`  |
| Coverage   | `npm run test:coverage` to find gaps, `coverage/index.html` for detail |

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

**Name the behaviour, not its history.** `it('checks all uploads, not just the
first (bug fix)')` means nothing to a reader who doesn't remember the bug.

## Table-driven tests

Anything with more than two or three examples belongs in a table, driven with
`it.each`. **A table makes the gaps visible** — an empty cell is obvious in a
way that a missing `it()` never is.

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

`fileFormats.spec.ts` is the worked example. Two things that are easy to get
wrong:

- **One table, many functions.** Separate example sets are how a case ends up
  covered on one axis and not the other.
- **Derive rows from a shared constant** when one exists: the video rows come
  from `VIDEO_EXTENSIONS`, so a new extension inherits the contract. Derive the
  _rows_, never the _expectations_ — an expectation computed the way the code
  computes it asserts nothing.

## Fixtures

Shared fixtures live in `src/lib/test-support/`: the record builders and the
canonical album paths. Spell a path out instead where the path is the subject
rather than the setting.

Build them complete, so the compiler checks them too.

```typescript
// ✅ Yes — a new required field on the server types breaks one file
export function imageRecord(fields: Partial<ImageRecord> & Pick<ImageRecord, 'itemType'>): ImageRecord {
    return { ...BASE_MEDIA, ...fields };
}

// ❌ No — asserts a shape the server never sends, and keeps compiling
const record = { itemType: 'image', path: '/2024/01-01/photo.jpg' } as GalleryRecord;
```

Pass a factory only the fields the test is about; keep the rest in a shared
constant. What varies between rows is what the test is saying.

## Mocking

```typescript
// ✅ URL.createObjectURL exists in Node, so replace just the method
vi.spyOn(URL, 'createObjectURL').mockImplementation(...);

// ✅ Image does not exist in Node at all
vi.stubGlobal('Image', FakeImage);

// ❌ replaces the whole global, URL constructor included, for every module
vi.stubGlobal('URL', { createObjectURL, revokeObjectURL });
```

**Let the fixture decide the outcome, not the mock.** A stub that always
succeeds means the failure path is never tested, which is usually the path that
matters. Key the outcome off the input:

```typescript
const CORRUPT = 'corrupt'; // a file named corrupt.jpg fails to decode

await validateMediaBatch([mediaItem('corrupt.jpg')]);
```

**Record what the mock was asked to do**, when the interaction is part of the
contract: that every object URL created was released, or that an `<img>` was
never pointed at a HEIC file.

`restoreMocks` and `unstubGlobals` are on in `vite.config.ts`; no `afterEach` needed.

## Comment the why, never the what

`expect(getDetailWidth(1024, 768)).toBe(1024)` already says what it does. It
doesn't say that 1024 is the boundary and the comparison is inclusive. That's
the comment worth writing.

## Check a test by breaking the code

A test earns its place by failing when the code is wrong. That is not the same
as running the code — a suite can be green, fast, readable and prove almost
nothing.

When you doubt a test earns its place, break the code on purpose: invert a
comparison, delete a branch, change a constant. If the suite stays green, the
test is decorative.

## Testing a store

Stores split into state transition methods and service methods (see
`CLAUDE.md`), and the split matters for testing:

- **State transition methods** are synchronous and are the only way state
  changes. They need no mocking — runes work outside a component, so a
  `.svelte.ts` store can be imported and driven directly. Cover these first.
- **Service methods** are async and reach into the API and other stores.
  Covering them means standing those up: worth doing, but a different size of
  job. Say so in the file rather than leaving it looking overlooked.

Stores are exported as singletons, so a spec resets in `beforeEach` rather than
constructing one. `DraftMachine.svelte.spec.ts` is the worked example.

## End-to-End tests with Playwright

E2E specs run against a real deployment — localhost by default, staging or prod
via `BASE_URL`. They walk real album data, so they cover integration and can't
make claims about specific content.

Which locator API to use is settled by lint. The judgment it leaves you is when
to fall back to `getByTestId`.

Use it only where the markup offers nothing a user could perceive. Here that is
the thumbnail grid: a thumbnail is an unlabelled `<div>`, and its image is
decorative (`alt=""`) inside an `aria-hidden` anchor, so `getByRole` cannot
reach either. Both carry a testid. The media region and the Next link have real
roles and accessible names, so neither does.

A testid on something that could carry a role or a label buys a passing test
and leaves the markup no more navigable than it was.

`no-nth-methods` rules out `.first()` without saying what replaces it. Wait for
the collection to be non-empty, then resolve it, so auto-waiting survives:

```typescript
const thumbnails = page.getByRole('main').getByTestId('thumbnail');
await expect(thumbnails).not.toHaveCount(0);
const [thumbnail] = await thumbnails.all();
```

The site is entirely client-rendered, so nothing is present on load and every
assertion must wait. Waits are set once in `playwright.config.ts` —
`expect.timeout` and `navigationTimeout` — rather than per assertion, so a new
spec inherits them and an inline timeout means the spec has a reason.

Shared e2e helpers live in `tests/test-support/`.

Wrap a journey in steps: walk through several pages in one test rather than
several independent ones, because a later page is usually only reachable by
arriving from the earlier one. `test.step` is then what says where it failed.

A failure leaves an HTML report in `playwright-report/`, trace included
(`npx playwright show-report`). CI uploads it as an artifact, on green runs too:
a test that only passed on its second attempt is the one worth opening.
