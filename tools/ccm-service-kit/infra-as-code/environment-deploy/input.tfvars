# Copyright 2022 Google LLC All Rights Reserved.
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

#TODO: Set values for the following variables
#project_id = ""
#composer_instance_name = ""
#service_account = "ccm-worker-sa@<project_id>.iam.gserviceaccount.com"

#region = ""
#zone = ""


files_path = [{
        gcs_path = "dags/__init__.py",
        local_file = "../../composer/dag/__init__.py"
    },
    {
        gcs_path = "dags/dag-ccm-pipeline-test.py",
        local_file = "../../composer/dag/dag-ccm-pipeline-test.py"
    },
    {
        gcs_path = "dags/dag-sts-job-test.py",
        local_file = "../../composer/dag/dag-sts-job-test.py"
    },
    {
        gcs_path = "dags/dependencies/__init__.py",
        local_file = "../../composer/dag/dependencies/__init__.py"
    },
    {
        gcs_path = "dags/dependencies/operators/__init__.py",
        local_file = "../../composer/dag/dependencies/operators/__init__.py"
    },
    {
        gcs_path = "dags/dependencies/operators/api_request.py",
        local_file = "../../composer/dag/dependencies/operators/api_request.py"
    },
    {
        gcs_path = "dags/dependencies/operators/run_sts_job.py",
        local_file = "../../composer/dag/dependencies/operators/run_sts_job.py"
    },
    {
        gcs_path = "dags/dependencies/queries/__init__.py",
        local_file = "../../composer/dag/dependencies/queries/__init__.py"
    },
    {
        gcs_path = "dags/dependencies/queries/ccm_queries.py",
        local_file = "../../composer/dag/dependencies/queries/ccm_queries.py"
    },
    {
        gcs_path = "dags/dependencies/scripts/__init__.py",
        local_file = "../../composer/dag/dependencies/scripts/__init__.py"
    },
    {
        gcs_path = "dags/dependencies/scripts/run_sts.py",
        local_file = "../../composer/dag/dependencies/scripts/run_sts.py"
    },
    {
        gcs_path = "dags/dependencies/variables/variables.json",
        local_file = "../../composer/variables/variables.json"
    }
]