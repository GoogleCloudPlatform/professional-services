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

import glob
import os
import shutil

from google.cloud import storage


def del_dir(directory_to_delete):
    if os.path.exists(directory_to_delete):
        try:
            shutil.rmtree(directory_to_delete)
            print("Directory and its contents deleted successfully.")
        except OSError as e:
            print(f"Error: {e}")

def copy_local_directory_to_gcs(local_folder, bucket_name=None, gcs_path=""):
    """Recursively copy a directory of files to GCS bucket model_artifacts-<project_id>/<run_id>."""
    try:
        gcp_project = os.getenv("GOOGLE_CLOUD_PROJECT", default="")
        if not gcp_project:
            print("Notice: GOOGLE_CLOUD_PROJECT not set. Artifacts saved locally.")
            return
        if not bucket_name or bucket_name == "curated_models":
            bucket_name = f"model_artifacts-{gcp_project}"
        storage_client = storage.Client(project=gcp_project)
        try:
            bucket = storage_client.get_bucket(bucket_name)
        except Exception:
            try:
                bucket = storage_client.create_bucket(bucket_name, project=gcp_project, location="us-central1")
            except Exception:
                bucket = storage_client.bucket(bucket_name)

        assert os.path.isdir(local_folder)
        for local_file in glob.glob(local_folder + '/**'):
            if not os.path.isfile(local_file):
                continue
            file_name = os.path.basename(local_file)
            remote_path = f"{local_folder}/{file_name}"
            blob = bucket.blob(remote_path)
            blob.upload_from_filename(local_file)
        print(f"Uploaded artifacts to gs://{bucket_name}/{local_folder}/")
    except Exception as e:
        print(f"Warning: Could not upload artifacts to GCS bucket '{bucket_name}': {e}. Artifacts kept locally.")

def save_artifacts(model_name, model_content, folder_name):
# def save_artifacts(tool_context: ToolContext):
    # modeller_agent_output = tool_context.state["modeller_agent_output"]
    # modeller_agent_output = json.loads(modeller_agent_output)
    # folder_name = datetime.datetime.now().strftime("%Y%m%d%H%M%S")
    # Path(folder_name).mkdir()
    # for model_name, model_content in modeller_agent_output.items():
    #     if model_content:
    with open(f"{folder_name}/{model_name}.txt", "w") as f:
        f.write(model_content)
    copy_local_directory_to_gcs(folder_name)
    print("Artifacts saved successfully")