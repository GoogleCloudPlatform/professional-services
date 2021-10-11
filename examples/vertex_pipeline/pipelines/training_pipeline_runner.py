# Copyright 2021 Google LLC. All Rights Reserved.
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


import argparse
from absl import logging

from kfp.v2.google.client import AIPlatformClient


def run_training_pipeline():
  parser = argparse.ArgumentParser()
  parser.add_argument('--project_id', type=str)
  parser.add_argument('--pipeline_region', type=str)
  parser.add_argument('--pipeline_root', type=str)
  parser.add_argument('--pipeline_job_spec_path', type=str)
  # Staging path for running custom job
  parser.add_argument('--data_pipeline_root', type=str)
  # Parameters required for data ingestion and processing
  parser.add_argument('--input_dataset_uri', type=str)
  parser.add_argument('--training_data_schema', type=str)
  parser.add_argument('--data_region', type=str)
  parser.add_argument('--gcs_data_output_folder', type=str)
  # Parameters required for training job
  parser.add_argument('--training_container_image_uri', type=str)
  parser.add_argument('--train_additional_args', type=str, default='{}')
  parser.add_argument('--output_model_file_name', type=str, default='model.txt')
  parser.add_argument('--serving_container_image_uri', type=str)
  parser.add_argument('--custom_job_service_account', type=str)
  parser.add_argument('--vpc_network', type=str)
  # Parameters required for hypterparameter tuning through Vizer
  parser.add_argument('--hptune_region', type=str)
  parser.add_argument('--hp_config_max_trials', type=int, default=30)
  parser.add_argument('--hp_config_suggestions_per_request', type=int, default=5)

  parser.add_argument('--metrics_name', type=str)
  parser.add_argument('--metrics_threshold', type=float)
  # Parameters required for endpoint deployment
  parser.add_argument('--endpoint_machine_type',
                      type=str, default='n1-standard-4')
  parser.add_argument('--endpoint_test_instances', type=str)
  parser.add_argument('--endpoint_min_replica_count', type=str, default=1)
  parser.add_argument('--endpoint_max_replica_count', type=str, default=2)
  # Parameters required for model monitoring
  parser.add_argument('--monitoring_user_emails', type=str)
  parser.add_argument('--monitoring_log_sample_rate', type=float)
  parser.add_argument('--monitor_interval', type=int)
  parser.add_argument('--monitoring_default_threshold', type=float)
  parser.add_argument('--monitoring_custom_skew_thresholds', type=str)
  parser.add_argument('--monitoring_custom_drift_thresholds', type=str)
  parser.add_argument('--enable_model_monitoring', type=str,
                      choices=['True', 'False'], default='True')
  # Parameters required for pipeline scheduling
  parser.add_argument('--pipeline_schedule',
                      type=str, default='', help='0 2 * * *')
  parser.add_argument('--pipeline_schedule_timezone',
                      type=str, default='US/Pacific')

  parser.add_argument('--enable_pipeline_caching',
                      action='store_true',
                      default=False,
                      help='Specify whether to enable caching.')

  args, _ = parser.parse_known_args()
  logging.info(args)

  api_client = AIPlatformClient(args.project_id, args.pipeline_region)

  params_to_remove = ['pipeline_region', 'pipeline_root',
                      'pipeline_job_spec_path', 'pipeline_schedule',
                      'pipeline_schedule_timezone', 'enable_pipeline_caching']
  pipeline_params = vars(args).copy()
  for item in params_to_remove:
    pipeline_params.pop(item, None)

  if not args.pipeline_schedule:
    api_client.create_run_from_job_spec(
      args.pipeline_job_spec_path,
      pipeline_root=args.pipeline_root,
      parameter_values=pipeline_params,
      enable_caching=args.enable_pipeline_caching
    )
  else:
    api_client.create_schedule_from_job_spec(
      args.pipeline_job_spec_path,
      schedule=args.pipeline_schedule,
      time_zone=args.pipeline_schedule_timezone,
      pipeline_root=args.pipeline_root,
      parameter_values=pipeline_params,
      enable_caching=args.enable_pipeline_caching
    )


if __name__ == "__main__":
  run_training_pipeline()
