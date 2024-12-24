REFINED_INGESTION_INVALID_RECORDS_CONFIG = {
    "dp_from_sftp": {
        "table_sftp1": (
            f"""
                processing_dttm IS NULL
            """
        ),
        "table_sftp2": {
            "table_sftp1": (
                f"""
                processing_dttm IS NULL
            """
            )
        },
    }
}
