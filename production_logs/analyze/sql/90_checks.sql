-- Invariants. Each returns ZERO rows when healthy; any row is a finding.
--
-- These guard the SHAPE the layer assumes, and CloudFront's shape is whatever the
-- delivery was last configured to emit: a field renamed or dropped in the console
-- shows up here as NULLs, never as an error, unless something says so.
--
-- Each reader keeps its own checks beside it, as `<source>_checks`, so a reader
-- and its guard change together. This is the union of them plus the one check
-- about the layer itself.

CREATE OR REPLACE VIEW checks AS
FROM cloudfront_checks
UNION ALL FROM user_agent_checks
UNION ALL FROM gateway_checks
UNION ALL FROM probe_checks
UNION ALL FROM lambda_checks

UNION ALL
-- No VIEW may read the filesystem. A view over a file reader re-reads its files on
-- every query, resolved against the CALLER's working directory, and `query` does
-- not cd. read_csv raises there, which is loud; glob returns an empty result, so a
-- view built on one reports nothing found, with no error, from every directory
-- but this one. Matched on the shape of a call, with the paren, so this branch
-- does not match its own text.
SELECT 'view_reads_filesystem',
       'View ' || view_name || ' reads the filesystem, so it resolves only from '
         || 'analyze/sql/ and is empty or failing everywhere else; make it a TABLE'
FROM duckdb_views()
WHERE internal = false
  AND regexp_matches(sql, '"?\bread_[a-z_]*"?\s*\(|"?\bglob"?\s*\(');

COMMENT ON VIEW checks IS 'Zero rows means healthy. Any row is a finding -- most often that the log delivery''s field list changed and a column has quietly gone NULL.';
