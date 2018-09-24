#!/bin/bash

# Copyright 2017 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#            http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

if [ "$#" -ne 4 ]; then
   echo "Usage: ./run_oncloud.sh project-id gcs-bucket pusub-topic bigquery-table"
   echo "Example: ./run_oncloud.sh my-project my-bucket my-topic my-dataset.my-table"
   exit
fi

PROJECT=$1
BUCKET="gs://$2"
TOPIC="projects/${PROJECT}/topics/$3"
TABLE="${PROJECT}:$4"
MAIN=com.google.cloud.demo.iot.nirvana.pipeline.TemperaturePipeline

echo "project=${PROJECT}\n bucket=${BUCKET}\n topic=${TOPIC}\n table=${TABLE}\n"

mvn -pl pipeline exec:java \
  -Dexec.mainClass=${MAIN} \
  -Dexec.args="--project=${PROJECT} \
      --inputTopic=${TOPIC} \
      --table=${TABLE} \
      --stagingLocation=$BUCKET/dataflow/staging/ \
      --tempLocation=$BUCKET/dataflow/temp/ \
      --errLocationPrefix=$BUCKET/dataflow/errors/messages \
      --runner=DataflowRunner \
      --streaming=true"
