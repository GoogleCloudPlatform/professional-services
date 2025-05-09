from google.cloud import bigquery


def export_bigquery_to_gcs(project_id, bq_table_name, gcs_destination_uri):
    """Exports data from a BigQuery table to a GCS bucket in CSV format.

    Args:
        project_id (str): Your Google Cloud project ID.
        bq_table_name (str): The fully qualified name of the BigQuery table
                             (e.g., 'your_dataset.your_table').
        gcs_destination_uri (str): The GCS URI where the data will be exported
                                  (e.g., 'gs://your_bucket/your_folder/your_file.csv').
    """
    try:
        bq_client = bigquery.Client(project=project_id)

        # Construct the extract job configuration
        job_config = bigquery.ExtractJobConfig(
            destination_format="CSV",
            print_header=True,  # Include header row in the CSV
        )

        # Create and run the extract job
        extract_job = bq_client.extract_table(
            source=bq_table_name,
            destination_uris=gcs_destination_uri,
            job_config=job_config,
        )  # API request
        extract_job.result()  # Waits for job to complete

        print(f"Exported data from {bq_table_name} to {gcs_destination_uri}")

    except Exception as e:
        print(f"Error exporting data from BigQuery to GCS: {e}")
