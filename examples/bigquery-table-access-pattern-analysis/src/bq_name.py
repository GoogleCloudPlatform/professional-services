# Copyright 2019-2020 Faculty Science Limited
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

import os

class BQName():
    input_project_id = os.getenv('INPUT_PROJECT_ID')
    input_dataset_id = os.getenv('INPUT_DATASET_ID')
    input_audit_logs_table_id = os.getenv('INPUT_AUDIT_LOGS_TABLE_ID')

    output_project_id = os.getenv('OUTPUT_PROJECT_ID')
    output_dataset_id = os.getenv('OUTPUT_DATASET_ID')
    output_table_suffix = os.getenv('OUTPUT_TABLE_SUFFIX')

    @staticmethod
    def get_input_dataset_complete_path():
        return f"{BQName.input_project_id}.{BQName.input_dataset_id}"
    
    @staticmethod
    def get_output_dataset_name():
        return f"{BQName.output_project_id}.{BQName.output_dataset_id}"

    @staticmethod
    def get_audit_log_data_access_table_name():
        return f"{BQName.get_input_dataset_complete_path()}.{BQName.input_audit_logs_table_id}"

    @staticmethod
    def get_standardised_root_queries_and_aggr_job_info_table_name():
        return f"{BQName.get_output_dataset_name()}.standardised_root_queries_and_aggr_job_info{BQName.output_table_suffix}"

    @staticmethod
    def get_job_info_with_query_info_table_name():
        return f"{BQName.get_output_dataset_name()}.job_info_with_query_info{BQName.output_table_suffix}"

    @staticmethod
    def get_smallest_subqueries_info_table_name():
        return f"{BQName.get_output_dataset_name()}.smallest_subqueries_info{BQName.output_table_suffix}"

    @staticmethod
    def get_job_info_with_tables_info_table_name():
        return f"{BQName.get_output_dataset_name()}.job_info_with_tables_info{BQName.output_table_suffix}"

    @staticmethod
    def get_source_destination_pairs_table_name():
        return f"{BQName.get_output_dataset_name()}.source_destination_pairs{BQName.output_table_suffix}"

    @staticmethod
    def get_pipeline_info_table_name():
        return f"{BQName.get_output_dataset_name()}.pipeline_info{BQName.output_table_suffix}"

    @staticmethod
    def get_table_direct_pipelines_table_name():
        return f"{BQName.get_output_dataset_name()}.table_direct_pipelines{BQName.output_table_suffix}"
