# Sinks

Example
```json
"sinks":[
    {
        "type": "GCS-CSV",
        "delimiter":",",
        "location":"gs://bigdata-poc-landing-8265/test1/csv/"
    },
    {
        "type": "BIGQUERY",
        "table_id":"sbx-13455.bigdatapoc.data-generator-test1",
        "write_disposition":"WRITE_TRUNCATE"
    }
```

| Field | Description | Possible values |
|----------|----------|----------|
| type | Type of sink |  `GCS-CSV`,`GCS-AVRO`,`BIGQUERY`  |


## Bigquery

Example
```json
{
    "type": "BIGQUERY",
    "table_id":"sbx-13455.bigdatapoc.data-generator-test1",
    "write_disposition":""
}
```

| Field | Description | Possible values |
|----------|----------|----------|
| table_id | Table id of the Bigquery table |  -  |
| write_disposition | Specifies the action that occurs if the destination table already exists. [Documentation](https://cloud.google.com/bigquery/docs/reference/rest/v2/Job) | `WRITE_TRUNCATE`, `WRITE_APPEND`, `WRITE_EMPTY`  |

## Google Cloud Storage - AVRO

Example
```json
{
    "type": "GCS-AVRO",
    "location":"gs://bigdata-poc-landing-8265/test1/avro/output.avro",
    "schema": {
        "doc": "This is a sample",
        "name": "Sample",
        "namespace": "test",
        "type": "record",
        "fields": [
            {"name": "id", "type": "string"},
            {"name": "date", "type": "string"},
            {"name": "phone_number", "type": "string"},
            {"name": "product_id", "type": "string"},
            {"name": "country", "type": "string"},
            {"name": "amount", "type": "float"},
            {"name": "price", "type": "float"},
            {"name": "customer_satisfaction", "type": "float"},
        ]
    }
}
```

| Field | Description |  Possible values |
|----------|----------|----------|
| location | GCS location in which to store the output AVRO files   | -  |
| schema | AVRO schema. [Documentation](https://avro.apache.org/docs/1.11.1/specification/) | -  |