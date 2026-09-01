# Copyright 2026 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

from google.cloud import bigquery


def cleanup_ddl(ddl, project_id, dataset_id):
    ddl_lines = ddl.split("\n")
    cleaned_ddl_lines = []
    for line in ddl_lines:
        if "```"in line:
            continue
        if "CREATE TABLE" in line:
            if "project_id" in line:
                line = line.replace("project_id", project_id)
            if "dataset_id" in line:
                line = line.replace("dataset_id", dataset_id)
        cleaned_ddl_lines.append(line.strip())
    cleaned_ddl = "\n".join(cleaned_ddl_lines)
    return cleaned_ddl
    
def validate_ddl(ddl_statement):
    client = bigquery.Client()
    try:
        job_config = bigquery.QueryJobConfig(dry_run=True, use_query_cache=False)
        query_job = client.query(ddl_statement, job_config=job_config)
        query_job.result()  # This will raise an exception if the DDL is invalid
        print("DDL statement is valid.")
    except Exception as e:
        print(f"DDL validation failed: {e}")
        return False
    return True


def create_bigquery_dataset(project_id, dataset_id, dataset_to_be_deleted, location="US"):
    """Creates a BigQuery dataset in the specified project and location."""
    client = bigquery.Client(project=project_id)

    # Construct a full Dataset object to specify location
    dataset_ref = bigquery.DatasetReference(project_id, dataset_id)
    dataset = bigquery.Dataset(dataset_ref)
    dataset.location = location
    if dataset_to_be_deleted:
        try:
            client.delete_dataset(dataset, delete_contents=True, not_found_ok=True)
        except Exception as e:
            print(f"Error deleting dataset: {e}")
            return {
                'status': 'error',
                "message": f"Dataset {dataset_id} could not be deleted in project {project_id}.",
            }
        print(f"Deleted dataset {dataset_id} in project {project_id}.")
    try:
        dataset = client.create_dataset(dataset)  # API request
        print(f"Dataset {dataset.dataset_id} created in project {client.project} at location {dataset.location}.")
    except Exception as e:
        print(f"Error creating dataset: {e}")
        if "Already Exists" in str(e):
            print(f"Dataset {dataset_id} already exists in project {project_id}.")
            return {
                'status': 'error',
                "message": f"Dataset {dataset_id} already exists in project {project_id}. Do you want to delete the dataset and create a new one?",
            }
    return None

def execute_bq_ddl(ddl_statement):
        # Initialize a BigQuery client
    client = bigquery.Client()
    try:
    # Execute the DDL query
    # The .result() method blocks until the job completes, providing job status and results.
        query_job = client.query(ddl_statement)
        query_job.result()  # Wait for the job to complete
    except Exception as e:
        print(f"DDL statement execution failed: {e}")
        return False

    print("DDL statement executed successfully.")
    return True