## Example Running the dbt script from the CLI
```
dbt run --vars '{"project_id": [Your Project id], "bigquery_location": "us", "execution_date": "1970-01-01"}' --profiles-dir .dbt --models raw
```