# Copyright 2024 Google LLC

# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at

# https://www.apache.org/licenses/LICENSE-2.0

# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

from __future__ import annotations

import argparse
import glob
import os
import ssl

import vertexai
from google.auth import default
from google.cloud import storage
from vertexai.language_models import CodeGenerationModel

parser = argparse.ArgumentParser()
parser.add_argument("-gcs_path", type=str, help="gcs folder path for training file", required=True)
parser.add_argument("-project_id", type=str, help="GCP Project", required=True)
parser.add_argument("-region", type=str, help="GCP Region", default="us-central1")
parser.add_argument("-service_account", type=str, help="Service Account with permissions of Storage Admin and Vertex "
                                                       "AI User",
                    default="")
args = parser.parse_args()


def tune_code_generation_model(training_file_on_gcs: str) -> None:
    ssl._create_default_https_context = ssl._create_unverified_context

    # Initialize Vertex AI
    credentials, _ = default(scopes=["https://www.googleapis.com/auth/cloud-platform"])
    vertexai.init(project=args.project_id, service_account=args.service_account, location="us-central1",
                  credentials=credentials)

    model = CodeGenerationModel.from_pretrained("code-bison-32k")

    tuning_job = model.tune_model(
        training_data=training_file_on_gcs,
        tuning_job_location=args.region,
        tuned_model_location=args.region,
        model_display_name="allspark"
    )

    print(tuning_job._status)


def create_tmp_file():
    # delete consolidated training file if exists
    if glob.glob("consolidated_training_data.jsonl"):
        os.remove("consolidated_training_data.jsonl")

    files = glob.glob("*.jsonl")
    with open('consolidated_training_data.jsonl', 'w') as outfile:
        for fname in files:
            with open(fname) as infile:
                outfile.write(infile.read())


def write_training_file_to_gcs() -> str:
    create_tmp_file()
    storage_client = storage.Client()
    bucket_name, bucket_path = args.gcs_path[5:].split("/", 1)
    bucket = storage_client.bucket(bucket_name)
    if not bucket_path.endswith("/"):
        bucket_path = bucket_path+"/"
    blob = bucket.blob(bucket_path+"consolidated_training_data.jsonl")
    blob.upload_from_filename("consolidated_training_data.jsonl")
    os.remove("consolidated_training_data.jsonl")
    return "gs://"+bucket_name+"/"+bucket_path+"consolidated_training_data.jsonl"


if __name__ == "__main__":
    training_file_on_gcs = write_training_file_to_gcs()
    tune_code_generation_model(training_file_on_gcs)
