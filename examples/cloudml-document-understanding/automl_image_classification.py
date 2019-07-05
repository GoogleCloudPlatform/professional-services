#!/usr/bin/env python

# Copyright 2018 Google LLC
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

"""This application demonstrates how to perform basic operations on dataset
with the Google AutoML Vision API.
For more information, the documentation at
https://cloud.google.com/vision/automl/docs.
"""

import argparse
import os

from google.cloud import automl_v1beta1 as automl

def create_dataset(project_id, compute_region, dataset_name, multilabel=False):
    """Create a dataset."""
    
    client = automl.AutoMlClient()

    # A resource that represents Google Cloud Platform location.
    project_location = client.location_path(project_id, compute_region)

    # Classification type is assigned based on multilabel value.
    classification_type = "MULTICLASS"
    if multilabel:
        classification_type = "MULTILABEL"

    # Specify the image classification type for the dataset.
    dataset_metadata = {"classification_type": classification_type}
    # Set dataset name and metadata of the dataset.
    my_dataset = {
        "display_name": dataset_name,
        "image_classification_dataset_metadata": dataset_metadata,
    }

    # Create a dataset with the dataset metadata in the region.
    dataset = client.create_dataset(project_location, my_dataset)

    # Display the dataset information.
    print("Dataset name: {}".format(dataset.name))
    print("Dataset id: {}".format(dataset.name.split("/")[-1]))
    print("Dataset display name: {}".format(dataset.display_name))
    print("Image classification dataset metadata:")
    print("\t{}".format(dataset.image_classification_dataset_metadata))
    print("Dataset example count: {}".format(dataset.example_count))
    print("Dataset create time:")
    print("\tseconds: {}".format(dataset.create_time.seconds))
    print("\tnanos: {}".format(dataset.create_time.nanos))

    dataset_id = dataset.name.split("/")[-1]
    return dataset_id

    # [END automl_vision_create_dataset]

def import_data(project_id, compute_region, dataset_id):
    """Import labeled images."""

    client = automl.AutoMlClient()

    # Get the full path of the dataset.
    dataset_full_id = client.dataset_path(
        project_id, compute_region, dataset_id
    )

    path = "gs://" + project_id + "-vcm/patents_data/image_classification/patents_image_labels.csv"

    # Get the multiple Google Cloud Storage URIs.
    input_uris = path.split(",")
    input_config = {"gcs_source": {"input_uris": input_uris}}

    # Import the dataset from the input URI.
    response = client.import_data(dataset_full_id, input_config)

    print("Processing import...")
    # synchronous check of operation status.
    print("Data imported. {}".format(response.result()))

    # [END automl_vision_import_data]

def create_model(project_id, 
				 compute_region, 
				 dataset_id, 
				 model_name, 
				 train_budget=24):
    """Create a model."""

    client = automl.AutoMlClient()

    # A resource that represents Google Cloud Platform location.
    project_location = client.location_path(project_id, compute_region)

    # Set model name and model metadata for the image dataset.
    my_model = {
        "display_name": model_name,
        "dataset_id": dataset_id,
        "image_classification_model_metadata": {"train_budget": train_budget}
        if train_budget
        else {},
    }

    # Create a model with the model metadata in the region.
    response = client.create_model(project_location, my_model)

    print("Training operation name: {}".format(response.operation.name))
    print("Training started...")

    # [END automl_vision_create_model]


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

  create_model(project_id=args.project_id,
  			   compute_region=args.compute_region,
  			   dataset_id=dataset_id,
  			   model_name='patent_image_model')
