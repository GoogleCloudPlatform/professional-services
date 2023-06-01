# dataflow-bigquery-to-alloydb

We are going to be moving data from a public dataset stored in BigQuery into a
table that will be created in AlloyDB.
This is the BigQuery query that will generate the source data:

```sql
SELECT
    from_address,
    to_address,
    CASE
        WHEN SAFE_CAST(value AS NUMERIC) IS NULL THEN 0
        ELSE SAFE_CAST(value AS NUMERIC)
        END AS value,
    block_timestamp
FROM
    bigquery-public-data.crypto_ethereum.token_transfers
WHERE
    DATE(block_timestamp) = DATE_ADD(CURRENT_DATE(), INTERVAL -1 DAY)
```

## Create the AlloyDB table in which we will store the BigQuery data

Create a database for the table in AlloyDB:

```SQL
CREATE DATABASE ethereum;
```

Create the table in which we will write the BigQuery data:

```sql
CREATE TABLE token_transfers (
    from_address VARCHAR,
    to_address VARCHAR,
    value NUMERIC,
    block_timestamp TIMESTAMP
);
```

## Create the local environment

```
python3 -m venv env
source env/bin/activate
pip3 install -r requirements.txt
```

## Running the Dataflow pipeline

If the Python environment is not activated, you need to do it:

```
source env/bin/activate
```

For running the Dataflow pipeline, a Bucket is needed for staging the BigQuery
data. If you don't have a bucket, please create one in the same region in
which Dataflow will run, for example in `southamerica-east1`

```
gcloud storage buckets create gs://<BUCKET_NAME> --location=southamerica-east1
```

Configure environment variables

```
TMP_BUCKET=<name of the bucket used for staging>
PROJECT=<name of your GCP project>
REGION=<name of the GCP region in which Dataflow will run>
SUBNETWORK=<ID of the subnetwork in which Dataflow will run, for example:
https://www.googleapis.com/compute/v1/projects/<NAME_OF_THE_VPC_PROJECT>/regions/<REGION>/subnetworks/<NAME_OF_THE_SUBNET>
ALLOYDB_IP=<IP address of AlloyDB>
ALLOYDB_USERNAME=<USERNAME used for connecting to AlloyDB>
ALLOYDB_PASSWORD=<PASSWORD used for connecting to AlloyDB>
ALLOYDB_DATABASE=ethereum
ALLOYDB_TABLE=token_transfers
BQ_QUERY="
    SELECT
        from_address,
        to_address,
        CASE
            WHEN SAFE_CAST(value AS NUMERIC) IS NULL THEN 0
            ELSE SAFE_CAST(value AS NUMERIC)
            END AS value,
        block_timestamp
    FROM
        bigquery-public-data.crypto_ethereum.token_transfers
    WHERE
        DATE(block_timestamp) = DATE_ADD(CURRENT_DATE(), INTERVAL -1 DAY)
"
```

Execute the pipeline

```
python3 main.py \
    --runner DataflowRunner \
    --region ${REGION} \
    --project ${PROJECT} \
    --temp_location gs://${TMP_BUCKET}/tmp/ \
    --alloydb_username ${ALLOYDB_USERNAME} \
    --alloydb_password ${ALLOYDB_PASSWORD} \
    --alloydb_ip ${ALLOYDB_IP} \
    --alloydb_database ${ALLOYDB_DATABASE} \
    --alloydb_table ${ALLOYDB_TABLE} \
    --bq_query "${BQ_QUERY}" \
    --no_use_public_ips \
    --subnetwork=${SUBNETWORK}
```
