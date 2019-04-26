# Copyright 2019 Google LLC.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

python -m ml_dataprep.runner \
	--parameters 15_19 20_24 25_29 30_34 35_39 40_44 45_49 \
	--source_project=bigquery-public-data \
	--source_dataset=census_bureau_international \
	--source_table=age_specific_fertility_rates \
	--destination_project=[PROJECT_ID] \
	--destination_dataset=[DATASET] \
	--destination_gcs_path=[BUCKET_URI]
