#!/usr/bin/env python

# Copyright 2019 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import os
import datetime
import pandas as pd

from google.cloud import bigquery, storage, vision, automl_v1beta1 as automl
from wand.image import Image

now = datetime.datetime.now()


def convert_pdfs(input_bucket_name, output_bucket_name, temp_directory, output_directory, service_acct):
    """Converts all pdfs in a bucket to png.

    Args:
      input_bucket_name (string): Bucket of Public PDFs
      output_bucket_name (string): Bucket for Converted PNGs
      temp_directory (string): Temporary Local Directory for coversion
    """

    # Get Images from Public Bucket
    client = storage.Client.from_service_account_json(service_acct)
    input_bucket = client.get_bucket(input_bucket_name)
    output_bucket = client.get_bucket(output_bucket_name)

    # Create temp directory & all intermediate directories
    if not os.path.exists(temp_directory):
        os.makedirs(temp_directory)

    for blob in client.list_blobs(input_bucket):
        if (blob.name.endswith('.pdf')):

            pdf_basename = os.path.basename(blob.name)
            png_basename = pdf_basename.replace('.pdf', '.png')

            # Download the file to a local temp directory to convert
            temp_pdf = os.path.join(temp_directory, pdf_basename)
            temp_png = os.path.join(temp_directory, png_basename)

            print(f"Downloading {pdf_basename}")
            input_bucket.get_blob(pdf_basename).download_to_filename(temp_pdf)

            # Convert PDF to PNG
            print(f"Converting to PNG")
            with Image(filename=temp_pdf, resolution=300) as pdf:
                with pdf.convert('png') as png:
                    png.save(filename=temp_png)

            # Upload to GCS Bucket
            print(f"Uploading to Cloud Storage")
            output_bucket.blob(os.path.join(
                output_directory, png_basename)).upload_from_filename(temp_png)

            # Remove Temp files, Don't want to fill up our local storage
            print(f"Deleting temporary files\n")
            os.remove(temp_pdf)
            os.remove(temp_png)

    # Delete the entire temporary directory
    os.rmdir(temp_directory)


def image_classification(project_id, dataset_id, table_id, service_acct, input_bucket_name, output_bucket_name, region):

    print(f"Processing image_classification")

    dest_uri = f"gs://{output_bucket_name}/patent_demo_data/image_classification.csv"

    df = bq_to_df(project_id, dataset_id, table_id, service_acct)

    output_df = df.replace({
        input_bucket_name: "patent_demo_data/" + output_bucket_name,
        r"\.pdf": ".png"
    }, regex=True, inplace=False)

    # Get Classification Columns
    output_df = output_df[["file", "issuer"]]
    output_df.to_csv(dest_uri, header=False, index=False)

    dataset_metadata = {
        "display_name": "patent_demo_data" + now,
        "image_classification_dataset_metadata": {
            "classification_type": "MULTICLASS"
        }
    }

    model_metadata = {
        'display_name': "patent_demo_data" + now,
        'dataset_id': None,
        'image_classification_model_metadata': {}
    }

    create_automl_model(project_id, region,
                        dataset_metadata, model_metadata, dest_uri, service_acct)


def entity_extraction(project_id, dataset_id, table_id, input_bucket_name, output_bucket_name):
    return


def object_detection(project_id, dataset_id, table_id, service_acct, input_bucket_name, output_bucket_name):

    dest_uri = f"gs://{output_bucket_name}/patent_demo_data/object_detection.csv"

    print(f"Processing object_detection")

    df = bq_to_df(project_id, dataset_id, table_id, service_acct)

    df.replace({
        input_bucket_name: output_bucket_name,
        r"\.pdf": ".png"
    }, regex=True, inplace=True)

    # Add Columns for AutoML
    # AutoML automatically splits data into Train, Test, Validation Sets
    df.insert(loc=0, column="set", value="UNASSIGNED")
    df.insert(loc=2, column="label", value="FIGURE")

    df.insert(loc=5, column="", value="", allow_duplicates=True)
    df.insert(loc=6, column="", value="", allow_duplicates=True)
    df.insert(loc=9, column="", value="", allow_duplicates=True)
    df.insert(loc=10, column="", value="", allow_duplicates=True)

    df.to_csv(dest_uri, header=False, index=False)

    return dest_uri


def text_classification(project_id, dataset_id, table_id, input_bucket_name, output_bucket_name):

    dest_uri = f"gs://{output_bucket_name}/text_classification.csv"

    print(f"Processing text_classification")

    # df = bq_to_df(project_id, dataset_id, table_id)

    # plug images into cloud vision

    # df["file"]

    return dest_uri


def bq_to_df(project_id, dataset_id, table_id, service_acct):
    """Fetches Data From BQ Dataset, outputs as dataframe
    """

    client = bigquery.Client.from_service_account_json(service_acct)
    table = client.get_table(f"{dataset_id}.{table_id}")
    df = client.list_rows(table).to_dataframe()
    return df


def create_automl_model(project_id, compute_region, dataset_metadata, model_metadata, path, service_acct):
    """Create dataset and import data. Create Model"""

    client = automl.AutoMlClient.from_service_account_file(service_acct)

    # A resource that represents Google Cloud Platform location.
    parent = client.location_path(project_id, compute_region)

    # Create a dataset with the dataset metadata in the region.
    dataset = client.create_dataset(parent, dataset_metadata)

    # Import data from the input URI.
    response = client.import_data(dataset.name, {
        "gcs_source": {
            "input_uris": [path]
        }
    })

    print("Processing import...")

    print(f"Data imported. {response.result()}")

    # dataset.name is the dataset_id
    model_metadata["dataset_id"] = dataset.name

    response = client.create_model(parent, model_metadata)

    print('Training operation name: {}'.format(response.operation.name))
    print('Training started. This will take a while.')
