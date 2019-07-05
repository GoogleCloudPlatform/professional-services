#!/bin/bash
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
#
# Shell script to run Natural Entity Recognition.

# User needs to Enable the API to access on UI
# TODO: These variables will need to be set to the user's project, region.
# Move these variables to a config file the user will edit directly
export PROJECT_ID='munn-sandbox'
export REGION_NAME='us-central1'

export DATASET_NAME='patent_dataset'
export multilabel=False

export GOOGLE_APPLICATION_CREDENTIALS="keys/key.json"

# Copy the dataset to your bucket from GCS
#gsutil -m cp -r gs://pdf-processing-219114/demo_prod/entity_extraction gs://$PROJECT_ID-vcm/patents_data/entity_extraction

# Change the location of the files for labels to import data
#gsutil cp gs://$PROJECT_ID-vcm/patents_data/entity_extraction/patents_ner_labels.csv .
#sed -i -e "s/pdf-processing-219114\/demo_prod/$PROJECT_ID-vcm\/patents_data/g" patents_ner_labels.csv
#gsutil cp patents_ner_labels.csv gs://$PROJECT_ID-vcm/patents_data/entity_extraction/patents_ner_labels.csv
#rm patents_ner_labels.csv

python automl_ner_model.py \
  --project_id=$PROJECT_ID \
  --compute_region=$REGION_NAME \
  --dataset_name=$DATASET_NAME