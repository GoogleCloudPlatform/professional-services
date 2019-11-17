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

import training_utils
import yaml

config = yaml.safe_load(open("config.yaml", "r"))

# Create data needed for training AutoML models below
# Convert pdfs to png and txt files and upload to users GCS bucket
training_utils.convert_pdfs(
    main_project_id=config["pipeline_project"]["project_id"],
    input_bucket_name=config["pdp_project"]["bucket_name"],
    region=config["pipeline_project"]["region"],
    service_acct=config["service_acct"]["key_path"])

# Create AutoML Image Classification model
training_utils.image_classification(
    main_project_id=config["pipeline_project"]["project_id"],
    data_project_id=config["pdp_project"]["project_id"],
    dataset_id=config["pdp_project"]["dataset_id"],
    table_id=config["pdp_project"]["image_table_id"],
    service_acct=config["service_acct"]["key_path"],
    input_bucket_name=config["pdp_project"]["bucket_name"],
    region=config["pipeline_project"]["region"])

# Create AutoML Object Detection model
training_utils.object_detection(
    main_project_id=config["pipeline_project"]["project_id"],
    data_project_id=config["pdp_project"]["project_id"],
    dataset_id=config["pdp_project"]["dataset_id"],
    table_id=config["pdp_project"]["objdetect_table_id"],
    service_acct=config["service_acct"]["key_path"],
    input_bucket_name=config["pdp_project"]["bucket_name"],
    region=config["pipeline_project"]["region"])

# Create AutoML Text Classification model
training_utils.text_classification(
    main_project_id=config["pipeline_project"]["project_id"],
    data_project_id=config["pdp_project"]["project_id"],
    dataset_id=config["pdp_project"]["dataset_id"],
    table_id=config["pdp_project"]["text_table_id"],
    service_acct=config["service_acct"]["key_path"],
    input_bucket_name=config["pdp_project"]["bucket_name"],
    region=config["pipeline_project"]["region"])

# Create AutoML Natural Entity Recognition model
training_utils.entity_extraction(
    main_project_id=config["pipeline_project"]["project_id"],
    data_project_id=config["pdp_project"]["project_id"],
    dataset_id=config["pdp_project"]["dataset_id"],
    table_id=config["pdp_project"]["ner_table_id"],
    service_acct=config["service_acct"]["key_path"],
    input_bucket_name=config["pdp_project"]["bucket_name"],
    region=config["pipeline_project"]["region"],
    config=config)
