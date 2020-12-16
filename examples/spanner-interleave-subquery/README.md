# spanner-interleave-subquery

This example contains the benchmark code to examine query efficiency gains of using Cloud Spanner interleaved tables with subqueries.

## Prerequisite

Run the following command to create a Cloud Spanner database with [schema.sql](schema.sql).

```bash
gcloud spanner databases create ${DATABASE} --instance=${INSTANCE} --ddl-file=schema.sql
```

## How to run the benchmark

Run the following command. You might need Go 1.15 or higher.

```bash
go run main.go --project=${PROJECT} --instance=${INSTANCE} --database=${DATABASE} --pattern=${PATTERN} --parallel=${PARALLEL}
```

For `--pattern` flag please specify the following number.

1. Insert sample data.
2. Run benchmark with separated queries for interleaved tables.
3. Run benchmark with subqueries for interleaved tables.

You might need to run `--pattern=1` prior to running the benchmark for `--pattern=2` or `--pattern=3` to insert sample data.

Note that this benchmark runs forever unless you stop the process by Ctr+C (SIGINT).
