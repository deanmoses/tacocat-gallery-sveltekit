# Editing the analytics

This directory is the semantic layer: the SQL that turns raw CloudFront logs into relations that are safe to query. `../../README.md` is for people _using_ it; this is for people _changing_ it.

**Source-specific knowledge belongs in the file header, not here.** How CloudFront encodes a user agent, which fields came and went, which result types count as a cache hit: each lives at the top of the file that reads it. What follows is only the conventions common to every file.

## The build

`./build` concatenates every `*.sql` here, in filename order, into a database rebuilt from scratch. There is no incremental state and nothing to migrate: change the SQL, rebuild, done. It rebuilds only when an input is newer than the database, and `--force` overrides that. Without `--quiet` the check gate runs even when the build was skipped, and exits nonzero on a finding; `--quiet` builds and says nothing, which is what `query` calls before running the gate itself.

Filenames are `NN_thing.sql`, and `NN` is dependency order: a file may use anything defined in a lower number. Gaps are deliberate so a new file can land between two existing ones without renumbering. Paths inside the SQL are relative to this directory, so dumps are at `../../dumps/`.

## Tables and views

**Base readers create `TABLE`s. Derived relations are `VIEW`s.**

A view over a file reader re-reads the files on every query, resolved against whatever working directory the caller is in, so it works from here and nowhere else, including from `query`, which deliberately does not cd. Materializing the readers means the file paths are needed once, at build time. `view_reads_filesystem` enforces this rather than leaving it a convention.

**An intermediate that should not survive the build is a `TEMP TABLE`.** The build is a single connection, so a temp table lives exactly as long as it is needed and is absent from the discovery listing because it is absent from the database. `cf_lines` is one: every raw CloudFront line, read once and split by two readers.

## Every relation carries a COMMENT

State the **grain** first, _one row per what_. Then, if there is one, the specific wrong answer the relation prevents. These are the discovery surface, so a relation without one is invisible. They are also the only home for a fact: if it is in a COMMENT, it does not also belong in a file header or in `../../README.md`.

## Every source is optional

A reader gets its files through `source_files(pattern)`, which hands back the empty `absent_source` when nothing matches, so a source nobody pulled builds as relations with zero rows. `coverage` is what says which sources are actually there.

## Checks

Every `checks` branch returns zero rows when healthy; any row is a finding, and `build` exits nonzero.

A reader's checks live beside it, in a `<source>_checks` view in the reader's own file, so the guard changes with the shape it guards; `90_checks.sql` unions them and adds the one check about the layer itself.

Guard **shape**, not values. CloudFront's shape is whatever the log delivery was last configured to emit, and a field renamed in the console arrives as NULLs, never as an error. Data being unusual is not a defect; the layer misreading it is. A check that fires on an expected permanent condition is worse than no check, because it teaches everyone to ignore the whole list.

## Derive rather than declare

Reference data carries per-entity behavior; shared SQL stays uniform. The AVIF cutoff per platform is a row in `avif_support`, not a `CASE` in `user_agents`, so supporting the next format is a column and the next browser is a row.

## Verifying a change

Rebuild and compare `summary` and `avif_readiness` against what they printed before. Row counts that move without an explanation _are_ the finding.

For a shape that has no data yet, add a case to `../test`. It builds this directory against `../fixtures/dumps/` in a temp directory and asserts what comes out. The fixtures are plain `.tsv` rather than `.gz` so a diff can be read; the reader takes both. Checks cannot cover the failures that matter most, because they run against `../../dumps/`, which is gitignored, private and always changing: the dangerous inputs are the ones production does not contain, and those have to be authored on purpose.
