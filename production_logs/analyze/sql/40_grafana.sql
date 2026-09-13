-- Grafana synthetic-monitoring check executions.
--
-- SOURCE: ../../dumps/grafana/synthetic/YYYY-MM-DD.ndjson, one JSON object per Loki
-- line as the puller received it: nanosecond timestamp, the logfmt line, the
-- stream labels, and the structured metadata. Two checks run every ten minutes
-- from three probes; each execution is about seven lines sharing an execution id,
-- and this folds them into one row.
--
-- The execution id arrives as a stream label; `metadata` is the third element the
-- Loki API documents for structured metadata, which the Grafana proxy has never
-- been seen to send. The reader accepts either, and the fixture exercises both.
--
-- The agent''s clock timestamps every line, and the roundtrip line carries its
-- own phase timestamps from the same clock, so the phase durations are exact to
-- the microsecond the cast keeps. `duration_ms` on the verdict line covers the
-- whole check including DNS resolution, which the roundtrip does not, so it can
-- exceed `total_ms` by a lot on the first request after a resolver cache expires.
--
-- No dump at all is not an error: the placeholder file beside this one is empty,
-- so the relations exist with zero rows and the CloudFront half still builds.
SET VARIABLE grafana_files = coalesce(
  (SELECT list(file) FROM glob('../../dumps/grafana/synthetic/*.ndjson')),
  ['./grafana_absent.ndjson']
);

CREATE OR REPLACE TABLE probe_lines AS
SELECT
  make_timestamp((timestamp::HUGEINT / 1000)::BIGINT) AS ts,
  coalesce(metadata ->> 'execution_id', labels ->> 'execution_id') AS execution_id,
  labels ->> 'job' AS check_name,
  labels ->> 'probe' AS probe,
  labels ->> 'region' AS region,
  labels ->> 'instance' AS target,
  (labels ->> 'probe_success') = '1' AS success,
  regexp_extract(line, 'msg="([^"]*)"', 1) AS msg,
  line,
  regexp_replace(filename, '^.*/', '') AS source_file
FROM read_json(getvariable('grafana_files'), format = 'newline_delimited', filename = true,
  columns = {'timestamp': 'VARCHAR', 'line': 'VARCHAR', 'labels': 'JSON', 'metadata': 'JSON'});

COMMENT ON TABLE probe_lines IS 'GRAIN: one row per line the synthetic-monitoring agent logged, about seven per execution. A failure''s wording lives only here. Count probe_executions, not this.';

-- A phase timestamp as the agent prints it: "2026-09-13 08:54:57.423128624 +0000 UTC".
CREATE OR REPLACE MACRO phase_ts(line, name) AS
  try_cast(regexp_extract(line, name || '="([^"+]+) \+0000 UTC"', 1) AS TIMESTAMP);

-- The lines every execution writes on its way to a verdict. Anything else the
-- agent says is an explanation of what went wrong, in whatever words that
-- failure has: "Failed to read HTTP response body", "Failed to get
-- decompressor for HTTP response body".
CREATE OR REPLACE MACRO is_progress_msg(msg) AS
  msg IN ('Beginning check', 'Resolving target address', 'Resolved target address',
          'Making HTTP request', 'Received HTTP response', 'Response timings for roundtrip',
          'Check succeeded', 'Check failed');

CREATE OR REPLACE TABLE probe_executions AS
SELECT
  execution_id,
  min(ts) AS ts,
  any_value(check_name) AS check_name,
  any_value(probe) AS probe,
  any_value(region) AS region,
  any_value(target) AS target,
  bool_and(success) AS success,
  max(try_cast(regexp_extract(line, 'status_code=(\d+)', 1) AS INTEGER)) FILTER (msg = 'Received HTTP response') AS status_code,
  max(regexp_extract(line, ' ip=([0-9a-f.:]+)', 1)) FILTER (msg = 'Resolved target address') AS resolved_ip,
  -- Wall time between the agent starting and finishing name resolution.
  epoch_ms(max(ts) FILTER (msg = 'Resolved target address') - min(ts) FILTER (msg = 'Resolving target address')) AS resolve_ms,
  epoch_ms(max(phase_ts(line, 'connectDone') - phase_ts(line, 'dnsDone')) FILTER (msg = 'Response timings for roundtrip')) AS connect_ms,
  epoch_ms(max(phase_ts(line, 'tlsDone') - phase_ts(line, 'tlsStart')) FILTER (msg = 'Response timings for roundtrip')) AS tls_ms,
  epoch_ms(max(phase_ts(line, 'responseStart') - phase_ts(line, 'gotConn')) FILTER (msg = 'Response timings for roundtrip')) AS ttfb_ms,
  epoch_ms(max(phase_ts(line, 'end') - phase_ts(line, 'start')) FILTER (msg = 'Response timings for roundtrip')) AS total_ms,
  round(1000 * max(try_cast(regexp_extract(line, 'duration_seconds=([0-9.]+)', 1) AS DOUBLE)) FILTER (msg IN ('Check succeeded', 'Check failed')), 1) AS duration_ms,
  -- What the agent said that was not routine, so a failed execution explains
  -- itself without a trip back to Grafana.
  string_agg(DISTINCT msg, '; ' ORDER BY msg) FILTER (NOT is_progress_msg(msg)) AS failure_reason,
  count(*) AS lines,
  bool_or(msg IN ('Check succeeded', 'Check failed')) AS has_verdict,
  any_value(source_file) AS source_file
FROM probe_lines
WHERE execution_id IS NOT NULL
GROUP BY execution_id;

COMMENT ON TABLE probe_executions IS 'GRAIN: one row per synthetic check execution: one probe hitting one target once. `success` is the agent''s verdict. Phase columns come from the roundtrip line and are NULL when the check failed before one; `duration_ms` is the whole check including DNS, so it can exceed `total_ms`. `failure_reason` is every non-routine message the agent logged, in its own words. `has_verdict` false means the lines were cut off, usually by a pull that landed mid-execution.';

CREATE OR REPLACE VIEW probe_health AS
SELECT
  ts::DATE AS day,
  check_name,
  probe,
  count(*) AS executions,
  count(*) FILTER (NOT success) AS failures,
  round(100.0 * count(*) FILTER (success) / count(*), 1) AS pct_success,
  round(median(ttfb_ms), 1) AS median_ttfb_ms,
  round(median(duration_ms), 1) AS median_duration_ms,
  round(quantile_cont(duration_ms, 0.9), 1) AS p90_duration_ms
FROM probe_executions
GROUP BY ALL
ORDER BY day, check_name, probe;

COMMENT ON VIEW probe_health IS 'GRAIN: one row per UTC day, check and probe. Uptime and latency as seen from outside, one row per region rather than blended: Paris reaching the API pays a transatlantic handshake that Ohio does not, and an average of the two describes nobody.';
