To generate Hive data , run generate_data.py with an integer value between [1,50]GB which produces '/tmp/generated_data.txt'

python generate_data.py --size-in-gb INTEGER_VALUE_BETWEEN_1_50

To create different hive tables using the previously generated data, run create_hive_tables.sql
This creates TEXTFILE,AVRO,ORC,PARQUET format tables, both partitioned and non-partitioned

hive -f create_hive_tables.sql


Create CloudSQL Instance "migration-metadata-bq"

sh create_sql_instance.sh <ROOT_PASSWORD> <IP_TO_BE_AUTHORIZED>

outputs the IP of CloudSQL Instance

Run migrate_hive_data.py with the following arguments

python migrate_hive_data.py \
--hive-database HIVE_DATABASE_NAME \
--hive-table HIVE_TABLE_NAME \
--project GCP_PROJECT_ID \
--bq-dataset-id BIGQUERY_DATASET_ID \
--gcs-bucket GCS_BUCKET_NAME  \
--bq-table-write-mode [ CREATE|APPEND|OVERWRITE ] \
--incremental-col id
--use-clustering [ True|False ]
