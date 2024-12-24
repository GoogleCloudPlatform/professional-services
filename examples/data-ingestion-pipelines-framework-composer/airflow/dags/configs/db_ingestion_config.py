from datetime import timedelta

DB_INGESTION_CONFIG = [
    {
        "dag_id": "teradata_ingestion",
        "schedule": timedelta(hours=24),
        "database_type": "teradata",
        "db_dataset": "DB_DATASET_NAME",
        "dataset_name": "dp_from_teradata",
        "tables": [{"table_name": "table_teradata"}],
    },
    {
        "dag_id": "oracle_ingestion",
        "schedule": timedelta(hours=24),
        "database_type": "oracle",
        "db_dataset": "DB_DATASET_NAME",
        "dataset_name": "dp_from_oracle",
        "tables": [
            {"table_name": "table_oracle"},
        ],
    },
]
