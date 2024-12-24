from datetime import timedelta

FILE_INGESTION_CONFIG = [
    {
        "dag_id": "sftp_ingestion",
        "schedule": timedelta(minutes=5),
        "sftp_dataset_dir": "/sftp/dir",
        "is_preprocesseing_required": False,
        "dataset_name": "dp_from_sftp",
        "tables": [
            {"table_name": "table_sftp1", "run_data_quality_scan": True},
            {
                "table_name": "table_sftp2",
                "custom_sftp_dir": "/sftp/custom/table2",
                "custom_file_pattern": "table2*",
                "run_data_quality_scan": True,
            },
        ],
    },
]
