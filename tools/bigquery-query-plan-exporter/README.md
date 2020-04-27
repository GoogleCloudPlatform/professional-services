# BigQuery Query Plan Exporter

This provides a utility for exporting query plans from BigQuery.

## Purpose

Query plan exporter is designed to be the enterprise version of `bq show -j --format=prettyjson <job-id>` because it does everything over a single session and handles a large volume of jobs. The goal is to have a tool that users can run and send the output for support when they have issues.


## Query Plan Analysis

If a user knows what they are looking for, they can pipe the output of the query plan exporter to another python program that uses `json.loads` on each line of stdin and flags queries with high shuffle bytes, wait ratio, or slot ms usage. An analysis program might print the tables involved and SQL query or print the full plan to be piped to yet another program. Each program in the chain may filter, transform or extract information from the query plan in a different way.

## Sharing Query Plans with Support

It's a common use case to capture query plans without analyzing them immediately. What information needs to be extracted and exactly which queries to extract it from is not necessarily known in advance. In support cases, users willoften simply want to hand over a bundle of logs to a support engineer who doesn't have access to the project.

## Benchmarking

After benchmarking, a set of SQL queries, there's no way to query query plans directly so it makes sense to export them en masse for later analysis.


## Performance

There is a big difference in UX for this utility compared to `bq show`:

BQ Show (takes over an hour to export 2000 queries, no date filter)
```
jobs=$(bq ls -j -n 2000 | grep query | awk -f {'print $1'})
for job in $jobs; do bq show -j --format=prettyjson $job >> plans.json; done
```

Query Plan Exporter (takes less than 30 seconds to export 2000 queries from the past 30 days)
```
bqexplain.py --project myproject --start_days_ago 30 > plans.json
```


## Usage

```py
bqexplain.py [--project <project-id>] [--location <location>] [--start_days_ago <start_days_ago>] [--end_days_ago <end_days_ago>]
```

start_days_ago is an integer representing the earliest date for which to export queries. defaults to 3 (3 days ago)

end_days_ago is is an optional integer argument used to calculate the latest date for which to export queries. defaults to 0 (today)

## Example Output

```json
{"id": "myproject:US.bquxjob_abc_123", "kind": "bigquery#job", "jobReference": {"projectId": "myproject", "jobId": "bquxjob_abc_123", "location": "US"}, "state": "DONE", "statistics": {"creationTime": 1550158672196.0, "startTime": 1550158672356.0, "endTime": 1550158674386.0, "totalBytesProcessed": "3536280000", "totalSlotMs": "39898", "query": {"queryPlan": [{"name": "S00: Input", "id": "0", "startMs": "1550158672576", "endMs": "1550158674215", "waitRatioAvg": 0.5344180225281602, "waitMsAvg": "427", "waitRatioMax": 0.5857321652065082, "waitMsMax": "468", "readRatioAvg": 0.43679599499374216, "readMsAvg": "349", "readRatioMax": 1.0, "readMsMax": "799", "computeRatioAvg": 0.55819774718398, "computeMsAvg": "446", "computeRatioMax": 0.9912390488110138, "computeMsMax": "792", "writeRatioAvg": 0.007509386733416771, "writeMsAvg": "6", "writeRatioMax": 0.05131414267834793, "writeMsMax": "41", "shuffleOutputBytes": "35416", "shuffleOutputBytesSpilled": "0", "recordsRead": "116280000", "recordsWritten": "1292", "parallelInputs": "92", "completedParallelInputs": "92", "status": "COMPLETE", "steps": [{"kind": "READ", "substeps": ["$2:category, $3:sales_amt, $4:qty, $1:date", "FROM mydataset.mytable", "WHERE and(greater_or_equal($1, 17318), less($1, 17410))"]}, {"kind": "AGGREGATE", "substeps": ["GROUP BY $30 := $2", "$20 := SUM($3)", "$21 := SUM($4)"]}, {"kind": "WRITE", "substeps": ["$30, $20, $21", "TO __stage00_output", "BY HASH($30)"]}]}, {"name": "S01: Output", "id": "1", "startMs": "1550158674245", "endMs": "1550158674298", "inputStages": ["0"], "waitRatioAvg": 0.0, "waitMsAvg": "0", "waitRatioMax": 0.0012515644555694619, "waitMsMax": "1", "readRatioAvg": 0.0, "readMsAvg": "0", "readRatioMax": 0.0, "readMsMax": "0", "computeRatioAvg": 0.006257822277847309, "computeMsAvg": "5", "computeRatioMax": 0.007509386733416771, "computeMsMax": "6", "writeRatioAvg": 0.007509386733416771, "writeMsAvg": "6", "writeRatioMax": 0.012515644555694618, "writeMsMax": "10", "shuffleOutputBytes": "289", "shuffleOutputBytesSpilled": "0", "recordsRead": "1292", "recordsWritten": "17", "parallelInputs": "9", "completedParallelInputs": "9", "status": "COMPLETE", "steps": [{"kind": "READ", "substeps": ["$30, $20, $21", "FROM __stage00_output"]}, {"kind": "AGGREGATE", "substeps": ["GROUP BY $40 := $30", "$10 := SUM($20)", "$11 := SUM($21)"]}, {"kind": "WRITE", "substeps": ["$10, $11", "TO __stage01_output"]}]}], "estimatedBytesProcessed": "3536280000", "timeline": [{"elapsedMs": "718", "totalSlotMs": "338", "pendingUnits": "87", "completedUnits": "5", "activeUnits": "87"}, {"elapsedMs": "1222", "totalSlotMs": "11368", "pendingUnits": "58", "completedUnits": "34", "activeUnits": "87"}, {"elapsedMs": "1999", "totalSlotMs": "55812", "pendingUnits": "0", "completedUnits": "101", "activeUnits": "6"}], "totalPartitionsProcessed": "92", "totalBytesProcessed": "3536280000", "totalBytesBilled": "3536846848", "billingTier": 1, "totalSlotMs": "39898", "cacheHit": false, "referencedTables": [{"projectId": "myproject", "datasetId": "mydataset", "tableId": "mytable"}], "statementType": "SELECT"}}, "configuration": {"jobType": "QUERY", "query": {"query": "select sum(sales_amt) sales_amt, sum(qty) qty\nfrom mydataset.mytable\nwhere date >= '2017-06-01' and date < '2017-09-01'\ngroup by category\n", "destinationTable": {"projectId": "myproject", "datasetId": "_abc123", "tableId": "anonabc123"}, "createDisposition": "CREATE_IF_NEEDED", "writeDisposition": "WRITE_TRUNCATE", "priority": "INTERACTIVE", "allowLargeResults": false, "useQueryCache": true, "useLegacySql": false}}, "status": {"state": "DONE"}, "user_email": "user@example.com"}
```


## File Layout
- [bqexplain.py](bqutil/bqexplain.py) BigQuery client wrapper and command-line executable


## Pre-requisites

You'll need to [download Python 3.4 or later](https://www.python.org/downloads/)

[Google Cloud Python Client](https://github.com/googleapis/google-cloud-python)


## Installation

cd to repository root and run `python3 -m pip install .`


## Disclaimer

This is not an official Google project.


## References

[Python Example Code](https://github.com/GoogleCloudPlatform/python-docs-samples)
[google-cloud-bigquery](https://pypi.org/project/google-cloud-bigquery/)

