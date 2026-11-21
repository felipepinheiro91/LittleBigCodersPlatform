-- Run on source and restored destination with psql -At -v ON_ERROR_STOP=1.
-- Compare both outputs before migrations or any writes to the destination.
-- Only counts and signatures are returned, not the records themselves.
WITH metrics AS (
    SELECT table_name,
        query_to_xml(
            format(
                'SELECT count(*) AS rows, md5(coalesce(string_agg(md5(row_to_json(t)::text), %L ORDER BY md5(row_to_json(t)::text)), %L)) AS hash FROM public.%I t',
                '', '', table_name
            ), false, true, ''
        ) AS x
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
)
SELECT table_name,
    (xpath('/row/rows/text()', x))[1]::text AS rows,
    (xpath('/row/hash/text()', x))[1]::text AS hash
FROM metrics
ORDER BY table_name;
