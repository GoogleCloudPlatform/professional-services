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

"""This application demonstrates how to perform basic operations on Dataset
with the Google AutoML Natural Language API.
For more information, see the tutorial page at
https://cloud.google.com/natural-language/automl/docs/
"""

import argparse
import os
from datetime import datetime
from google.cloud import automl_v1beta1 as automl

def create_dataset(project_id, compute_region, dataset_name, multilabel=False):
    """Create a dataset for entity extraction."""

    client = automl.AutoMlClient()

    # A resource that represents Google Cloud Platform location.
    project_location = client.location_path(project_id, compute_region)

    # Classification type is assigned based on multilabel value.
    classification_type = "MULTICLASS"
    if multilabel:
      classification_type = "MULTILABEL"

    # Specify the text classification type for the dataset.
    dataset_metadata = {"classification_type": classification_type}
    # Set dataset name and metadata.
    my_dataset = {
        "display_name": dataset_name,
        "text_extraction_dataset_metadata": dataset_metadata
    }

    # Create a dataset with the dataset metadata in the region.
    dataset = client.create_dataset(project_location, my_dataset)

    # Display the dataset information.
    print("Dataset name: {}".format(dataset.name))
    print("Dataset id: {}".format(dataset.name.split("/")[-1]))
    print("Dataset display name: {}".format(dataset.display_name))
    print("Dataset example count: {}".format(dataset.example_count))
    print("Dataset create time: {}".format(datetime.fromtimestamp(dataset.create_time.seconds).strftime("%Y-%m-%dT%H:%M:%SZ")))

def import_data(project_id, compute_region, dataset_id, path):
    """Import labelled items."""

    client = automl.AutoMlClient()

    # Get the full path of the dataset.
    dataset_full_id = client.dataset_path(
        project_id, compute_region, dataset_id
    )

    path = "gs://" + project_id + "-vcm/patents_data/entity_extraction/patents_ner_labels.csv"

    # Get the multiple Google Cloud Storage URIs.
    input_uris = path.split(",")
    input_config = {"gcs_source": {"input_uris": input_uris}}

    # Import the dataset from the input URI.
    response = client.import_data(dataset_full_id, input_config)

    print("Processing import...")
    # synchronous check of operation status.
    print("Data imported. {}".format(response.result()))

    # [END automl_natural_language_import_data]

if __name__ == '__main__':
  parser = argparse.ArgumentParser()
  parser.add_argument(
      '--project_id',
      help='.',
      required=True
  )
  parser.add_argument(
      '--compute_region',
      help='.',
      default='us-central1',
      required=True
  )
  parser.add_argument(
      '--dataset_name',
      required=True
  )

  args = parser.parse_args()
  
  # Create dataset and capture the dataset_id
  # TODO: Add a check here to see if the dataset already exists.
  dataset_id = create_dataset(project_id=args.project_id,
                              compute_region=args.compute_region,
                              dataset_name=args.dataset_name)

  import_data(project_id=args.project_id,
              compute_region=args.compute_region,
              dataset_id=dataset_id)
