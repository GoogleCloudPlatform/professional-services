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
import shutil
import datetime
import pandas as pd
import subprocess

from google.cloud import bigquery, vision, storage, automl_v1beta1 as automl
from google.cloud.automl_v1beta1 import enums
from wand.image import Image

now = datetime.datetime.now().strftime("_%m%d%Y_%H%M%S")


def convert_pdfs(main_project_id,
                 input_bucket_name,
                 temp_directory,
                 output_directory,
                 service_acct):
    """Converts all pdfs in a bucket to png.

    Args:
      input_bucket_name (string): Bucket of Public PDFs
      output_bucket_name (string): Bucket for Converted PNGs
      temp_directory (string): Temporary Local Directory for coversion
    """

    # Create temp directory & all intermediate directories
    if not os.path.exists(temp_directory):
        os.makedirs(temp_directory)

    # # Prepare PDFs for Image Classification/Object Detection
    # print("Downloading PDFs")

    # # TODO: need to make sure folder exists
    # subprocess.run(
    #     f'gsutil -m cp gs://{input_bucket_name}/*.pdf {temp_directory}', shell=True)

    # for f in os.scandir(temp_directory):
    #     if f.name.endswith(".pdf"):
    #         print(f"Converting {f.name} to PNG")
    #         temp_png = f.path.replace('.pdf', '.png')
    #         with Image(filename=f.path, resolution=300) as pdf:
    #             with pdf.convert('png') as png:
    #                 png.save(filename=temp_png)

    # print(f"Uploading to GCS")
    # output_bucket_name = main_project_id + "-vcm"

    # # Create Bucket if it doesn't exist
    # subprocess.run(f'gsutil mb -p main_project_id gs://{output_bucket_name}',
    #                shell=True)

    # subprocess.run(f'gsutil -m cp {temp_directory}/*.png gs://{output_bucket_name}/{output_directory}',
    #                shell=True)

    # Move Text Classification Preparation Here
    run_ocr(main_project_id, output_directory, temp_directory, service_acct)

    shutil.rmtree(temp_directory)


def image_classification(main_project_id,
                         data_project_id,
                         dataset_id,
                         table_id,
                         service_acct,
                         input_bucket_name,
                         region):

    print(f"Processing image_classification")

    output_bucket_name = main_project_id + "-vcm"

    # TODO Put output_bucket_name into config file for each dataset
    # TODO put output diretcory as argument to this function

    dest_uri = f"gs://{output_bucket_name}/patent_demo_data/image_classification.csv"

    df = bq_to_df(data_project_id, dataset_id, table_id, service_acct)

    output_df = df.replace({
        input_bucket_name: output_bucket_name + "/patent_demo_data",
        r"\.pdf": ".png"
    }, regex=True, inplace=False)

    # Get Classification Columns
    output_df = output_df[["file", "issuer"]]
    output_df.to_csv(dest_uri, header=False, index=False)

    dataset_metadata = {
        "display_name": "patent_demo_data" + str(now),
        "image_classification_dataset_metadata": {
            "classification_type": "MULTICLASS"
        }
    }

    model_metadata = {
        'display_name': "patent_demo_data" + str(now),
        'dataset_id': None,
        'image_classification_model_metadata': {"train_budget": 1}
    }

    create_automl_model(main_project_id,
                        region,
                        dataset_metadata,
                        model_metadata,
                        dest_uri,
                        service_acct)


def text_classification(main_project_id,
                        data_project_id,
                        dataset_id,
                        table_id,
                        service_acct,
                        input_bucket_name,
                        region):

    print(f"Starting AutoML text_classification.")

    output_bucket_name = main_project_id + "-lcm"

    # Create .csv file for importing data
    dest_uri = f"gs://{output_bucket_name}/patent_demo_data/text_classification.csv"

    df = bq_to_df(project_id=data_project_id,
                  dataset_id=dataset_id,
                  table_id=table_id,
                  service_acct=service_acct)

    output_df = df.replace({
        input_bucket_name: output_bucket_name + "/patent_demo_data/txt",
        r"\.pdf": ".txt"
    }, regex=True, inplace=False)

    # Get text classification columns
    output_df = output_df[["file", "class"]]
    output_df.to_csv(dest_uri, header=False, index=False)

    dataset_metadata = {
        "display_name": "patent_data" + str(now),
        "text_classification_dataset_metadata": {
            "classification_type": "MULTICLASS"
        }
    }

    model_metadata = {
        'display_name': "patent_data" + str(now),
        'dataset_id': None,
        'text_classification_model_metadata': {}
    }

    # Create AutoML model for text classification
    create_automl_model(project_id=main_project_id,
                        compute_region=region,
                        dataset_metadata=dataset_metadata,
                        model_metadata=model_metadata,
                        path=dest_uri,
                        service_acct=service_acct)


def entity_extraction(main_project_id,
                      data_project_id,
                      dataset_id,
                      table_id,
                      service_acct,
                      input_bucket_name,
                      region):
    df = bq_to_df(project_id=data_project_id,
                  dataset_id=dataset_id,
                  table_id=table_id,
                  service_acct=service_acct)
    return


def object_detection(main_project_id,
                     data_project_id,
                     dataset_id,
                     table_id,
                     service_acct,
                     input_bucket_name,
                     region):

    output_bucket_name = main_project_id + "-vcm"

    dest_uri = f"gs://{output_bucket_name}/patent_demo_data/object_detection.csv"

    print(f"Processing object_detection")

    df = bq_to_df(data_project_id, dataset_id, table_id, service_acct)

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

    dataset_metadata = {
        'display_name': 'patent_demo_data' + now,
        'image_object_detection_dataset_metadata': {},
    }

    model_metadata = {
        'display_name': "patent_demo_data" + now,
        'dataset_id': None,
        'image_object_detection_model_metadata': {}
    }

    create_automl_model(main_project_id,
                        region,
                        dataset_metadata,
                        model_metadata,
                        dest_uri,
                        service_acct)


def bq_to_df(project_id, dataset_id, table_id, service_acct):
    """Fetches Data From BQ Dataset, outputs as dataframe
    """
    client = bigquery.Client.from_service_account_json(service_acct)
    table = client.get_table(f"{project_id}.{dataset_id}.{table_id}")
    df = client.list_rows(table).to_dataframe()
    return df


def run_ocr(project_id, output_directory, temp_directory, service_acct):

    print("Processing Documents with Cloud Vision API")

    vision_client = vision.ImageAnnotatorClient.from_service_account_file(
        service_acct)

    image = vision.types.Image()

    storage_client = storage.Client.from_service_account_json(service_acct)
    blobs = storage_client.list_blobs(
        f"{project_id}-vcm", prefix=output_directory, delimiter="/")

    subprocess.run(
        f'gsutil mb -p main_project_id gs://{project_id}-lcm', shell=True)

    for blob in blobs:
        if blob.name.endswith(".png"):

            print(f"Processing {blob.name}")

            image.source.image_uri = f"gs://{project_id}-vcm/{blob.name}"
            response = vision_client.text_detection(image=image)

            # TODO Check if entity Extraction needs everything separated out
            # First text annotation is full text
            text = response.text_annotations[0].description
            temp_txt = os.path.join(
                temp_directory, os.path.basename(blob.name).replace(".png", ".txt"))

            with open(temp_txt, "w") as f:
                f.write(text)
                f.close()

    subprocess.run(
        f"gsutil -m cp {temp_directory}/*.txt gs://{project_id}-lcm/{output_directory}", shell=True)


def create_automl_model(project_id,
                        compute_region,
                        dataset_metadata,
                        model_metadata,
                        path,
                        service_acct):
    """Create dataset, import data, create model, replace model id in config.yaml"""

    client = automl.AutoMlClient.from_service_account_json(service_acct)

    # A resource that represents Google Cloud Platform location.
    project_location = client.location_path(project_id, compute_region)

    # Create a dataset with the dataset metadata in the region.
    print("Creating dataset...")
    dataset = client.create_dataset(project_location, dataset_metadata)

    print("Importing Data. This may take a few minutes.")
    # Import data from the input URI.
    response = client.import_data(dataset.name, {
        "gcs_source": {
            "input_uris": [path]
        }
    })

    print(f"Data imported. {response.result()}")

    # Set dataset_id into model metadata
    model_metadata["dataset_id"] = dataset.name.split("/")[-1]

    print("Training model...")
    response = client.create_model(project_location, model_metadata)
    print(f'Training operation name: {response.operation.name}')
    print('Training started. This will take a while.')
