# BigQuery

## Exporter

The BigQuery exporter will export SLO reports to a BigQuery table. This allows
teams to conduct historical analysis of SLO reports, and figure out what to do
to improve on the long-run (months, years).

**Config example:**

```yaml
exporters:
  - class: Bigquery
    project_id: "${BIGQUERY_HOST_PROJECT}"
    dataset_id: "${BIGQUERY_DATASET_ID}"
    table_id: "${BIGQUERY_TABLE_ID}"
```
