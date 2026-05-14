"""
Copyright 2025 Google. This software is provided as-is, 
without warranty or representation for any use or purpose. 
Your use of it is subject to your agreement with Google.

"""

from datetime import datetime
import config_vars  


def start_audit_log(
    bq_client_main, batch_id, input_gcs_path, table_attributes, header_gcs_path
):
    for table_name, gcs_path in input_gcs_path.items():
        row_to_insert = [
            {
                "batch_id": str(batch_id),
                "gcs_bucket_name": config_vars.gcs_bucket_name,  
                "input_gcs_path": gcs_path,
                "header_gcs_path": header_gcs_path.get(
                    table_name, None
                ),  # Use None if header_gcs_path not found
                "user_requested_table_count": config_vars.user_counts.get(
                    table_name
                ),  
                "table_name": table_name,
                "column_names": table_attributes[table_name]["column_names"],
                "column_header_flag": table_attributes[table_name][
                    "column_header_flag"
                ],
                "delimiter": table_attributes[table_name]["delimiter"],
                "custom_header": table_attributes[table_name]["custom_header"],
                "schema": table_attributes[table_name]["schema"],
                "num_records_generated": 0,  # Set to 0 initially, update later
                "status": "In Progress",
                "error_message": None,
                "insert_timestamp": datetime.now().isoformat(),
            }
        ]
        errors = bq_client_main.insert_rows_json(config_vars.audit_table, row_to_insert)
        if errors:
            print(f"Encountered errors while inserting rows: {errors}")
        else:
            print(
                "Audit log entry for {} inserted successfully with batch_id {}.".format(
                    table_name, str(batch_id)
                )
            )


def end_audit_log(
    bq_client_main, batch_id, input_gcs_path, table_attributes, header_gcs_path
):
    for table_name, gcs_path in input_gcs_path.items():
        row_to_insert = [
            {
                "batch_id": str(batch_id),
                "gcs_bucket_name": config_vars.gcs_bucket_name,  
                "input_gcs_path": gcs_path,
                "header_gcs_path": header_gcs_path.get(
                    table_name, None
                ),  # Use None if header_gcs_path not found
                "user_requested_table_count": config_vars.user_counts.get(
                    table_name
                ),  
                "table_name": table_name,
                "column_names": table_attributes[table_name]["column_names"],
                "column_header_flag": table_attributes[table_name][
                    "column_header_flag"
                ],
                "delimiter": table_attributes[table_name]["delimiter"],
                "custom_header": table_attributes[table_name]["custom_header"],
                "schema": table_attributes[table_name]["schema"],
                "num_records_generated": table_attributes[table_name][
                    "num_records_generated"
                ],
                "status": "Completed",
                "error_message": None,
                "insert_timestamp": datetime.now().isoformat(),
            }
        ]
        errors = bq_client_main.insert_rows_json(config_vars.audit_table, row_to_insert)
        if errors:
            print(f"Encountered errors while inserting rows: {errors}")
        else:
            print(
                "Audit log entry for {} inserted successfully with batch_id {}.".format(
                    table_name, str(batch_id)
                )
            )
