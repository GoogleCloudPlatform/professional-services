# DLP De-identification Pipeline

This Beam pipeline reads data from either Google Cloud Storage (GCS) or BigQuery (BQ), de-identifies sensitive data using DLP, and writes the de-identified data to the corresponding destination in GCS or BQ. The pipeline supports two modes:

* **GCS mode:** For processing files stored in GCS in Avro, CSV, TXT, DAT, and JSON formats.
* **BigQuery mode:** For processing data stored in BigQuery tables.

To learn more, read [DOC.md](DOC.md)

## Setup

Before running the pipeline, ensure the following prerequisites are met:

* **DLP Inspect Template:** A DLP inspect template that defines the types of sensitive data to be identified. See [steps](src/dlp/templates/README.md#setup-and-deploy-the-templates) for creating a DLP template. 
* **DLP De-identify Template:** A DLP de-identify template that defines how to transform the sensitive data. See [steps](src/dlp/templates/README.md#setup-and-deploy-the-templates) for creating a DLP template. 
* **Service Account:** A service account with the necessary permissions to access resources in both the source and destination projects. This service account should have the following roles:
    * **Source Project:** Dataflow Admin, Dataflow Worker, Storage Object Admin, DLP Administrator, BigQuery Data Editor, BigQuery Job User.
    * **Destination Project:** Storage Object Viewer, BigQuery Data Editor, BigQuery Job User.
* **BigQuery Schema (BigQuery mode only):**  The dataset and tables, including their schema, should already exist in the destination project.


## Pipeline Options
| Pipeline Option | Description |
|---|---|
| `project` | The Google Cloud project ID. |
| `region` | The Google Cloud region where the Dataflow job will run. |
| `job_name` | The name of the Dataflow job. |
| `service_account` | The service account used to run the Dataflow job. |
| `machine_type` | The machine type for Dataflow workers. |
| `max_num_workers` | The maximum number of Dataflow workers. |
| `job_dir` | The GCS location for staging Dataflow job files. |
| `prod` | A boolean flag indicating whether the pipeline is running in production mode. 'True' runs the pipeline with Dataflow runner while 'False' runs the pipeline locally.|
| `inspect_template` | The name of the DLP inspect template. |
| `deidentify_template` | The name of the DLP de-identify template. |
| `dlp_batch_size` | The batch size for processing data with DLP. The default is 100.|
| `mode` | The mode of operation: "gcs" for Google Cloud Storage or "bq" for BigQuery. |
| `input_dir` | (GCS mode) The GCS location of the input data. |
| `output_dir` | (GCS mode) The GCS location for the output data. It can be in a different project from the input |
| `input_projects` | (BigQuery mode) A list of Google Cloud project IDs containing the input BigQuery tables. |
| `output_projects` | (BigQuery mode) A list of Google Cloud project IDs where the output BigQuery tables will be written. |
| `config_file` | YAML config file with all the pipeline options set to avoid passing a lot of options in a command. |

## Run
1. To avoid passing many flags in the run command, fill [config.yaml](config.yaml) with the paramaters.

    - Example `config.yaml ` to deidentify data in GCS
        ```yaml
        project: project-id
        region: us-central1
        job_name: dlp-deid-pipeline
        service_account: dlp-deid-pipeline-sa@project-id.iam.gserviceaccount.com
        machine_type: n1-standard-2
        max_num_workers: 30
        job_dir: gs://staging-bucket
        prod: False

        # DLP Params
        inspect_template: projects/project-id/locations/global/inspectTemplates/inspect_template
        deidentify_template: projects/project-id/locations/global/deidentifyTemplates/deidentify_template
        dlp_batch_size: 100

        # Either "gcs" or "bq"
        mode: gcs

        # GCS mode required paramas
        input_dir: gs://input-bucket/dir
        output_dir: gs://output-bucket/dir
        ```

    - Example `config.yaml` to deidentify data in BigQuery
        ```yaml
        project: project-id
        region: us-central1
        job_name: dlp-deid-pipeline
        service_account: dlp-deid-pipeline-sa@project-id.iam.gserviceaccount.com
        machine_type: n1-standard-2
        max_num_workers: 30
        job_dir: gs://staging-bucket

        # DLP Params
        inspect_template: projects/project-id/locations/global/inspectTemplates/inspect_template
        deidentify_template: projects/project-id/locations/global/deidentifyTemplates/deidentify_template
        dlp_batch_size: 100

        # Either "gcs" or "bq"
        mode: bq

        # BigQuery mode required params
        input_projects:  input_projects1,input_projects2
        output_projects: output_projects1,output_projects2
    ```

2. Create virtual env
    ```bash
    python3 -m venv .venv
    source .venv/bin/activate
    ```

3. Run
    - Run locally
        ```
        python3 src.run --config_file config.yaml
        ```
    - Run on Dataflow
        ```
        python3 src.run --config_file config.yaml --prod true
        ```
