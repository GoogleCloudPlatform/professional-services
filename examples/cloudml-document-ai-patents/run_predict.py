"""Prediction pipeline using previously trained AutoML models."""
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


import automl_image
import automl_ner
import automl_objdetect
import automl_text
import final_view
import pdf2png
import yaml

config = yaml.safe_load(open("config.yaml", "r"))

# Convert sample pdfs to png and txt files
pdf2png.convert_pdfs(
  main_project_id=config["pipeline_project"]["project_id"],
  demo_dataset=config["pipeline_project"]["demo_dataset_id"],
  input_path=config["pipeline_project"]["demo_sample_data"],
  service_acct=config["service_acct"]["key_path"])

# Call prediction with AutoML image classification model
automl_image.predict(
  main_project_id=config["pipeline_project"]["project_id"],
  input_path=config["pipeline_project"]["demo_sample_data"],
  demo_dataset=config["pipeline_project"]["demo_dataset_id"],
  demo_table=config["model_imgclassifier"]["demo_table_id"],
  model_id=config["model_imgclassifier"]["model_id"],
  service_acct=config["service_acct"]["key_path"],
  compute_region=config["pipeline_project"]["region"])

# Call prediction with AutoML object detection model
automl_objdetect.predict(
  main_project_id=config["pipeline_project"]["project_id"],
  input_path=config["pipeline_project"]["demo_sample_data"],
  demo_dataset=config["pipeline_project"]["demo_dataset_id"],
  demo_table=config["model_objdetect"]["demo_table_id"],
  model_id=config["model_objdetect"]["model_id"],
  service_acct=config["service_acct"]["key_path"],
  compute_region=config["pipeline_project"]["region"])

# Call prediction with AutoML text classification model
automl_text.predict(
  main_project_id=config["pipeline_project"]["project_id"],
  input_path=config["pipeline_project"]["demo_sample_data"],
  demo_dataset=config["pipeline_project"]["demo_dataset_id"],
  demo_table=config["model_textclassifier"]["demo_table_id"],
  model_id=config["model_textclassifier"]["model_id"],
  service_acct=config["service_acct"]["key_path"],
  compute_region=config["pipeline_project"]["region"])

# Call prediction with AutoML entity extraction model
automl_ner.predict(
  main_project_id=config["pipeline_project"]["project_id"],
  input_path=config["pipeline_project"]["demo_sample_data"],
  demo_dataset=config["pipeline_project"]["demo_dataset_id"],
  demo_table=config["model_ner"]["demo_table_id"],
  model_id=config["model_ner"]["model_id"],
  service_acct=config["service_acct"]["key_path"],
  compute_region=config["pipeline_project"]["region"],
  config=config)

# Combine the results above into singel table
final_view.create(
  main_project_id=config["pipeline_project"]["project_id"],
  demo_dataset=config["pipeline_project"]["demo_dataset_id"],
  img_table=config["model_imgclassifier"]["demo_table_id"],
  objdet_table=config["model_objdetect"]["demo_table_id"],
  text_table=config["model_textclassifier"]["demo_table_id"],
  ner_table=config["model_ner"]["demo_table_id"],
  service_acct=config["service_acct"]["key_path"])
