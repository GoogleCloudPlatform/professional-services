"""
A utility to collect dataproc job metrics over a given timeframe.
"""

from datetime import timedelta, datetime
import json
import argparse
import logging as logger
from google.cloud import dataproc_v1, compute_v1, bigquery, storage
from google.api_core.exceptions import NotFound
import requests
import google.auth.transport.requests
from google.protobuf.json_format import MessageToDict


def to_camel_case(key_str: str):
    """Converts a snake_case string to camelCase."""
    key_str = key_str.replace("-", "_").replace(" ",
                                                "_")  # Normalize delimiters
    components = key_str.split("_")
    return components[0] + "".join(x.title() for x in components[1:])


def clean_up_keys(data):
    """Creates a new dictionary with camelCase keys from a given dictionary."""
    camel_case_dict = {}
    for key, value in data.items():
        if "HiveServer2" in key:
            key = "HiveServer2"
        if isinstance(value, dict):
            # Recursively handle nested dictionaries
            value = clean_up_keys(value)
        camel_case_dict[to_camel_case(key)] = value

    return camel_case_dict


def clean_up_values(data: dict):
    """Replaces empty dictionaries with None in a dictionary, including nested ones."""
    for key, value in data.items():
        if isinstance(value, dict):
            clean_up_values(value)
            if not value:
                data[key] = (
                    None  # BQ: Unsupported empty struct type for field
                )
            if "properties" in key:
                data[key] = str(data[key])  # wrap properties maps as strings
    return data


def upload_json_to_gcs(bucket_name: str, blob_name: str, data: dict):
    """ Upload json data to a GCS location. """
    logger.info(f"Uploading results to gs://{bucket_name}/{blob_name}")

    storage_client = storage.Client()
    bucket = storage_client.bucket(bucket_name)
    blob = bucket.blob(blob_name)

    ndjson_string = "\n".join(json.dumps(item) for item in data)

    # Upload the string to GCS
    blob.upload_from_string(ndjson_string, content_type="application/json")


def load_metrics_to_bigquery(
    bq_dataset: str,
    bq_table: str,
    bucket_name: str,
    blob_name: str,
    project_id: str,
    kms_key_name: str = None,
):
    """ Load a GCS object containing dataproc metrics into a BQ table  """
    logger.info(
        f"Loading results to BigQuery: {project_id}.{bq_dataset}.{bq_table}")

    bq_client = bigquery.Client(project=project_id)

    dataset_ref = bq_client.dataset(bq_dataset)
    table_ref = dataset_ref.table(bq_table)

    if kms_key_name:
        job_config = bigquery.LoadJobConfig(
            source_format=bigquery.SourceFormat.NEWLINE_DELIMITED_JSON,
            autodetect=True,
            create_disposition=bigquery.CreateDisposition.CREATE_IF_NEEDED,
            write_disposition=bigquery.WriteDisposition.WRITE_APPEND,
            destination_encryption_configuration=bigquery.
            EncryptionConfiguration(kms_key_name=kms_key_name),
        )
    else:
        job_config = bigquery.LoadJobConfig(
            source_format=bigquery.SourceFormat.NEWLINE_DELIMITED_JSON,
            autodetect=True,
            create_disposition=bigquery.CreateDisposition.CREATE_IF_NEEDED,
            write_disposition=bigquery.WriteDisposition.WRITE_APPEND,
        )

    load_job = bq_client.load_table_from_uri("gs://" + bucket_name + "/" +
                                             blob_name,
                                             table_ref,
                                             job_config=job_config)

    load_job.result()  # Waits for the job to complete


def collect_dataproc_job_metrics(project_id, region, hours, bucket_name,
                                 blob_name, bq_dataset, bq_table):
    """
    Uses the Dataproc Job, Dataproc Cluster, Compute, and GCS APIs to collect
    dataproc job metrics for all jobs that have ran in the last <user-provided>
    hours. Uploads results to GCS.
    """

    # -------------------------------------------------
    # Begin by getting all dataproc jobs in last x hours
    # -------------------------------------------------
    logger.info(f"Retrieving all dataproc jobs in the last {hours} hour(s).")

    creds, project = google.auth.default()
    auth_req = google.auth.transport.requests.Request()
    creds.refresh(auth_req)
    cred_token = creds.token

    dataproc_job_client = dataproc_v1.JobControllerClient(
        client_options={"api_endpoint": f"{region}-dataproc.googleapis.com"})
    dataproc_cluster_client = dataproc_v1.ClusterControllerClient(
        client_options={
            "api_endpoint": f"{region}-dataproc.googleapis.com:443"
        })

    # -------------------------------------------------
    # Get Jobs that have started recently
    # -------------------------------------------------

    dataproc_jobs = dataproc_job_client.list_jobs(request={
        "project_id": project_id,
        "region": region
    })

    now = datetime.now()
    min_range = datetime.timestamp(now - timedelta(hours=hours))

    timeframed_jobs = []
    all_jobs = []
    for dataproc_job in dataproc_jobs:
        all_jobs.append(dataproc_job)
        job_start = datetime.timestamp(
            dataproc_job.status_history[0].state_start_time)
        if job_start and job_start > min_range:
            timeframed_jobs.append(dataproc_job)

    all_job_counts = str(len(all_jobs))
    timeframed_jobs_counts = str(len(timeframed_jobs))
    print(f"All Jobs: {all_job_counts}")
    print(f"Jobs in the last {hours} hours: {timeframed_jobs_counts}")

    all_metrics = []
    dataproc_job_config = {}
    dataproc_cluster_config = {}
    primary_machine_type_config = {}
    secondary_machine_type_config = {}
    yarn_metrics = {}
    count = 0
    for dataproc_job in timeframed_jobs:
        count += 1
        print("Progress: " + str(round(count / len(timeframed_jobs) * 100, 2)) +
              "%")
        dataproc_job_config = MessageToDict(dataproc_job._pb)
        dataproc_cluster_name = dataproc_job_config.get("placement").get(
            "clusterName")

        try:
            dataproc_cluster = dataproc_cluster_client.get_cluster(
                project_id=project_id,
                region=region,
                cluster_name=dataproc_cluster_name,
            )
            dataproc_cluster_config = MessageToDict(dataproc_cluster._pb)

            # -------------------------------------------------
            # Collect metrics for cluster machine types
            # -------------------------------------------------

            compute_client = compute_v1.MachineTypesClient()

            primary_machine_type = str(
                dataproc_cluster.config.worker_config.machine_type_uri).rsplit(
                    "/", 1)[-1]
            primary_machine_type_config = MessageToDict(
                compute_client.get(
                    project=project_id,
                    zone=region + "-a",
                    machine_type=primary_machine_type,
                )._pb)

            secondary_worker_count = int(
                dataproc_cluster.config.secondary_worker_config.num_instances)
            secondary_machine_type_config = {}
            if secondary_worker_count > 0:
                secondary_machine_type = str(
                    dataproc_cluster.config.secondary_worker_config.
                    machine_type_uri).rsplit("/", 1)[-1]
                secondary_machine_type_config = MessageToDict(
                    compute_client.get(
                        project=project_id,
                        zone=region + "-a",
                        machine_type=secondary_machine_type,
                    )._pb)
        except NotFound:
            logger.info("Cluster not found for job id.")
            dataproc_cluster_config = None

        # -------------------------------------------------
        # Collect YARN metrics for Job if Cluster exists
        # -------------------------------------------------
        yarn_metrics = {}
        if dataproc_cluster_config:
            if dataproc_job.yarn_applications:
                yarn_endpoint = dataproc_cluster.config.endpoint_config.http_ports.get(
                    "YARN ResourceManager")
                application_id = dataproc_job.yarn_applications[
                    0].tracking_url.split("/")[-2]

                base_url = f"{yarn_endpoint}ws/v1/cluster/apps/{application_id}"
                try:
                    headers = {"Proxy-Authorization": f"Bearer {cred_token}"}
                    response = requests.get(url=base_url, headers=headers)
                    response.raise_for_status(
                    )  # Raise an exception for HTTP errors
                    yarn_metrics = response.json().get("app")

                except requests.exceptions.RequestException as e:
                    print(str(e))
                    continue

        job_metrics = {
            "dataproc_job_config": dataproc_job_config,
            "dataproc_cluster_config": dataproc_cluster_config,
            "primary_machine_config": primary_machine_type_config,
            "secondary_machine_config": secondary_machine_type_config,
            "yarn_metrics": yarn_metrics,
        }
        print(job_metrics)
        job_metrics = clean_up_keys(job_metrics)
        job_metrics = clean_up_values(job_metrics)
        all_metrics.append(job_metrics)

    if all_metrics:

        # -------------------------------------------------
        # Upload results to GCS
        # -------------------------------------------------
        upload_json_to_gcs(bucket_name=bucket_name,
                           blob_name=blob_name,
                           data=all_metrics)

        # -------------------------------------------------
        # Load results into BigQuery
        # -------------------------------------------------
        load_metrics_to_bigquery(
            project_id=project_id,
            bq_dataset=bq_dataset,
            bq_table=bq_table,
            bucket_name=bucket_name,
            blob_name=blob_name,
        )

        logger.info("Metric collection complete.")
    else:
        logger.error("No Dataproc jobs found in the specified timeframe.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Collect Dataproc job metrics and store them in BigQuery.")

    # Required Arguments
    parser.add_argument("--project_id",
                        type=str,
                        required=True,
                        help="Google Cloud project ID")
    parser.add_argument(
        "--region",
        type=str,
        required=True,
        help="Cloud region where the Dataproc jobs ran",
    )
    parser.add_argument(
        "--bq_dataset",
        type=str,
        required=True,
        help="BigQuery dataset to store metrics",
    )
    parser.add_argument(
        "--bucket_name",
        type=str,
        required=True,
        help="GCS bucket to store metrics data",
    )
    parser.add_argument("--bq_table",
                        type=str,
                        required=True,
                        help="BigQuery table to store metrics")

    # Optional Arguments (with defaults)
    parser.add_argument(
        "--hours",
        type=int,
        default=24,
        help="Number of hours to look back for job metrics (default: 24)",
    )
    parser.add_argument(
        "--blob_name",
        type=str,
        default="dataproc_metrics.json",
        help="Name of the GCS metrics blob",
    )

    args = parser.parse_args()

    # Call the function with the parsed arguments
    collect_dataproc_job_metrics(
        args.project_id,
        args.region,
        args.hours,
        args.bucket_name,
        args.blob_name,
        args.bq_dataset,
        args.bq_table,
    )
