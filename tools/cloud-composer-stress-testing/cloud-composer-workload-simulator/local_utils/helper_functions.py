""" """

import subprocess

import yaml
from cerberus import Validator
from google.cloud.orchestration.airflow import service_v1 as composer


def load_config_from_file(filepath):
    """
    Load YAML file into dictionary.
    """
    load_config = {}
    try:
        with open(filepath, "r") as f:
            load_config = yaml.safe_load(f)
    except FileNotFoundError:
        print("Error: config.yaml not found.")
    return load_config


def get_composer_environment_bucket(project_id, location, environment_name):
    """Gets the GCS bucket associated with a Cloud Composer environment.

    Args:
      project_id: The ID of the Google Cloud project that the service belongs to.
      location: The ID of the Google Cloud region that the service belongs to.
      environment_name: The name of the Cloud Composer environment.

    Returns:
      The GCS bucket associated with the Cloud Composer environment.
    """

    client = composer.EnvironmentsClient()
    name = f"projects/{project_id}/locations/{location}/environments/{environment_name}"

    response = client.get_environment(name=name)
    return response.config.dag_gcs_prefix


def upload_directory(source_folder, target_gcs_path):
    """Uploads a directory to GCS using gsutil with streaming output.

    Args:
        bucket_name (str): The name of the GCS bucket.
        source_folder (str): The path to the local directory to upload.
        target_prefix (str, optional): The prefix/folder in the GCS bucket
                                      where files should be uploaded.
                                      Defaults to None (root of the bucket).
    """

    command = ["gsutil", "-m", "cp", "-r", source_folder, target_gcs_path]

    process = subprocess.Popen(
        command,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        universal_newlines=True,
    )

    for line in process.stdout:
        print(line, end="")  # Print    each line of gsutil's output as it comes

    process.stdout.close()
    return_code = process.wait()

    if return_code:
        raise subprocess.CalledProcessError(return_code, command)


def validate_config(config):
    """
    Validates the config against a predefined schema.

    Args:
    config: The workload generation config

    Returns:
    True if the config is valid, False otherwise.
    Also prints any validation errors encountered.
    """

    # Define the schema for validation
    schema = {
        "experiment_id": {
            "type": "string",
            "minlength": 1,
            "maxlength": 50,
            "required": True,
        },
        "number_of_dags": {"type": "integer", "min": 1, "required": True},
        "min_tasks_per_dag": {"type": "integer", "min": 1, "required": True},
        "schedules": {"type": "dict", "schema": {}, "required": True},
        "start_dates": {"type": "dict", "schema": {}, "required": True},
        "taskflows": {
            "type": "dict",
            "schema": {
                "base": {"type": "dict", "schema": {}},
                "google_cloud": {"type": "dict", "schema": {}},
            },
            "required": True,
        },
        "default_settings": {
            "type": "dict",
            "schema": {
                "project_id": {
                    "type": "string",
                    "minlength": 1,
                    "maxlength": 100,
                    "required": True,
                },
                "region": {
                    "type": "string",
                    "minlength": 1,
                    "maxlength": 50,
                    "required": True,
                },
                "composer_environment": {
                    "type": "string",
                    "minlength": 1,
                    "maxlength": 100,
                    "required": True,
                },
                "deferrable": {"type": "boolean"},
                "retries": {"type": "integer", "min": 0},
                "retry_delay": {"type": "integer", "min": 0},
                "catchup": {"type": "boolean"},
                "is_paused_upon_creation": {"type": "boolean"},
                "dagrun_timeout": {"type": "integer", "min": 0},
                "execution_timeout": {"type": "integer", "min": 0},
                "sla": {"type": "integer", "min": 0},
                "mode": {"type": "string", "minlength": 1, "maxlength": 20},
                "poke_interval": {"type": "integer", "min": 0},
            },
            "required": True,
        },
    }

    # Validate the YAML against the schema
    v = Validator(schema)
    v.allow_unknown = True
    if v.validate(config):
        return True
    else:
        print("Validation errors:")
        for field, error in v.errors.items():
            print(f"- {field}: {error}")
        return False
