# spanner-interleave-subquery

This example contains the benchmark code to examine query efficiency gains of using Cloud Spanner interleaved tables with subqueries.

## Prerequisite

Create a Cloud Spanner database with [schema.sql](schema.sql).

## How to run the benchmark

Run the following command.

```bash
go run main.go --project=${PROJECT} --instance=${INSTANCE} --database=${DATABASE} --pattern=${PATTERN} --parallel=${PARALLEL}
```

For `--pattern` flag please specify the following number.

1. Run benchmark with separated queries for interleaved tables.
2. Run benchmark with subqueries for interleaved tables.
3. Insert sample data

You might need to run `--pattern=3` prior to running the benchmark for `--pattern=1` or `--pattern=2` to insert sample data.
