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

automl_utils.convert_pdfs(config["main_project"]["input_bucket_name"],
                          config["main_project"]["output_bucket_name"],
                          config["main_project"]["temp_directory"],
                          config["service_acct"]["key"])

automl_utils.image_classification(config["main_project"]["project_id"],
                                  config["model_imgclassifier"]["dataset_id"],
                                  config["model_imgclassifier"]["table_id"],
                                  config["service_acct"]["key"],
                                  config["main_project"]["input_bucket_name"],
                                  config["main_project"]["output_bucket_name"],
                                  config["main_project"]["region"])
