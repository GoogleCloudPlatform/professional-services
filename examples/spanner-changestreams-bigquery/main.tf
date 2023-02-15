/**
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

module "spanner_cs_bq_dataflow" {
  source                             = "./spanner_cs_bq_dataflow/"
  region                             = var.region
  project_id                         = var.project_id
  spanner_instance_name_for_userdata = var.spanner_instance_name_for_userdata
  spanner_instance_name_for_metadata = var.spanner_instance_name_for_metadata
  spanner_database_name_for_userdata = var.spanner_database_name_for_userdata
  spanner_database_name_for_metadata = var.spanner_database_name_for_metadata
  spanner_changestream_name          = var.spanner_changestream_name
  bigquery_dataset_name              = var.bigquery_dataset_name
  dataflow_job_name                  = var.dataflow_job_name
}
