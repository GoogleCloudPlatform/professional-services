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

import automl_utils
import yaml
import service_account

config = yaml.safe_load(open("../config.yaml", "r"))

service_account.create(config)

# Create data needed for training AutoML models below
# Convert pdfs to png and txt files and upload to users GCS bucket
automl_utils.convert_pdfs(main_project_id=config['main_project']['project_id'],
                          input_bucket_name=config["main_project"]["input_bucket_name"],
                          temp_directory=config["main_project"]["temp_directory"],
                          output_directory=config["main_project"]["output_directory"],
                          service_acct=config["service_acct"]["key"])

# Create AutoML Image Classification model
automl_utils.image_classification(main_project_id=config["main_project"]["project_id"],
                                  data_project_id=config["model_imgclassifier"]["project_id"],
                                   dataset_id=config["model_imgclassifier"]["dataset_id"],
                                   table_id=config["model_imgclassifier"]["table_id"],
                                   service_acct=config["service_acct"]["key"],
                                   input_bucket_name=config["main_project"]["input_bucket_name"],
                                   region=config["main_project"]["region"])

# Create AutoML Object Detection model
automl_utils.object_detection(main_project_id=config["main_project"]["project_id"],
                              data_project_id=config["model_objdetect"]["project_id"],
                              dataset_id=config["model_objdetect"]["dataset_id"],
                              table_id=config["model_objdetect"]["table_id"],
                              service_acct=config["service_acct"]["key"],
                              input_bucket_name=config["main_project"]["input_bucket_name"],
                              region=config["main_project"]["region"])

# Create AutoML Text Classification model
automl_utils.text_classification(main_project_id=config['main_project']['project_id'],
                                 data_project_id=config["model_textclassifier"]["project_id"],
                                 dataset_id=config["model_textclassifier"]["dataset_id"],
                                 table_id=config["model_textclassifier"]["table_id"],
                                 service_acct=config["service_acct"]["key"],
                                 input_bucket_name=config["main_project"]["input_bucket_name"],
                                 region=config["main_project"]["region"])
