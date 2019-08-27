"""Pipeline to create/train all necessary AutoML models."""

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

import service_account
import training_utils
import yaml

config = yaml.safe_load(open("config.yaml", "r"))

service_account.create(config)

# Create data needed for training AutoML models below
# Convert pdfs to png and txt files and upload to users GCS bucket
training_utils.convert_pdfs(
    main_project_id=config["main_project"]["project_id"],
    input_bucket_name=config["pdp_project"]["bucket_name"],
    service_acct=config["service_acct"]["key"])

# Create AutoML Image Classification model
training_utils.image_classification(
    main_project_id=config["main_project"]["project_id"],
    data_project_id=config["pdp_project"]["project_id"],
    dataset_id=config["pdp_project"]["dataset_id"],
    table_id=config["model_imgclassifier"]["pdp_table_id"],
    service_acct=config["service_acct"]["key"],
    input_bucket_name=config["pdp_project"]["bucket_name"],
    region=config["main_project"]["region"])

# Create AutoML Object Detection model
training_utils.object_detection(
    main_project_id=config["main_project"]["project_id"],
    data_project_id=config["pdp_project"]["project_id"],
    dataset_id=config["pdp_project"]["dataset_id"],
    table_id=config["model_objdetect"]["pdp_table_id"],
    service_acct=config["service_acct"]["key"],
    input_bucket_name=config["pdp_project"]["bucket_name"],
    region=config["main_project"]["region"])

# Create AutoML Text Classification model
training_utils.text_classification(
    main_project_id=config["main_project"]["project_id"],
    data_project_id=config["pdp_project"]["project_id"],
    dataset_id=config["pdp_project"]["dataset_id"],
    table_id=config["model_textclassifier"]["pdp_table_id"],
    service_acct=config["service_acct"]["key"],
    input_bucket_name=config["pdp_project"]["bucket_name"],
    region=config["main_project"]["region"])

# Create AutoML Natural Entity Recognition model
training_utils.entity_extraction(
    main_project_id=config["main_project"]["project_id"],
    data_project_id=config["pdp_project"]["project_id"],
    dataset_id=config["pdp_project"]["dataset_id"],
    table_id=config["model_ner"]["pdp_table_id"],
    service_acct=config["service_acct"]["key"],
    input_bucket_name=config["pdp_project"]["bucket_name"],
    region=config["main_project"]["region"],
    config=config)
