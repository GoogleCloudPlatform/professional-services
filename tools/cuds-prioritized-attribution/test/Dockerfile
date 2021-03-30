# Copyright 2020 Google Inc.
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

FROM gcr.io/google.com/cloudsdktool/cloud-sdk:latest

# install core tools
RUN apt-get update && apt-get install -y build-essential python3 python3-pip jq git google-cloud-sdk
RUN pip3 install pytest python-dateutil google-cloud-bigquery
RUN git clone https://github.com/GoogleCloudPlatform/professional-services.git

RUN cd professional-services/tools/cuds-prioritized-attribution/composer/ && pip3 install -r ./requirements.txt

#run commitment_interval
RUN cd ./professional-services/tools/cuds-prioritized-attribution/test && pytest test_commitment_intervals.py
RUN cd ./professional-services/tools/cuds-prioritized-attribution/test && echo "[DEFAULT]\nproject_id = arif-cascada-test\nbilling_export_dataset_id = cascada_tests\nenable_cud_cost_attribution = true\ncorrected_dataset_id = cascada_tests\ntest_data_dir = tests" > pytest.properties

# run integration test
RUN cd ./professional-services/tools/cuds-prioritized-attribution/test && pytest test_file_based_comparision.py
