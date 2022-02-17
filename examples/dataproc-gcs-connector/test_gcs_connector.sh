#!/bin/bash
# Copyright 2019 Google LLC.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# Update variables
export YOUR_BUCKET=output-examples
export YOUR_CLUSTER=dataproc-cluster

Q1='DROP TABLE Names;
CREATE TABLE Names
 (state string,
 gender string,
 year string,
 name string,
 number int,
 created_date string)
ROW FORMAT DELIMITED
FIELDS TERMINATED BY ","
LINES TERMINATED BY "\n"
STORED AS TEXTFILE;'

# Load data from public GCS bucket
Q2='LOAD DATA
INPATH "gs://python-dataflow-example/data_files/usa_names.csv"
INTO TABLE Names;'

Q3="DROP TABLE top_10_names;
CREATE TABLE top_10_names
ROW FORMAT DELIMITED
FIELDS TERMINATED BY ','
STORED AS TEXTFILE
LOCATION 'gs://output-examples/data_files/top_ten/' AS
SELECT * FROM Names ORDER BY number LIMIT 10;"

gcloud init
gcloud dataproc jobs submit hive --region=us-central1 \
  --cluster=${YOUR_CLUSTER} \
  -e="$Q1" -e="$Q2" -e="$Q3"

gsutil cat gs://${YOUR_BUCKET}/data_files/top_ten/000000_0
