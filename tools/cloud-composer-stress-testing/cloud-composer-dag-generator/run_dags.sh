#!/bin/bash

# Copyright 2023 Google LLC
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

usage() 
{
    echo "Illegal number of arguments passed. Supported and required arguments\
     are: -e {env_name}, -r {region}, -p {project}, -n {num_of_dags} "
    }

if [ $# -ne 8 ]; then
    usage
    exit 1
fi

while getopts ":e:r:p:n:" opt; do
  case $opt in
    e) ENV_NAME="$OPTARG"
    ;;
    r) REGION="$OPTARG"
    ;;
    p) PROJECT="$OPTARG"
    ;;
    n) NUM_DAGS="$OPTARG"
    ;;
    *) echo "Invalid option -$OPTARG" >&2
    exit 1
    ;;
  esac
done

for i in $(seq 1 "$NUM_DAGS"); 
do

    gcloud composer environments run "${ENV_NAME}" \
    --location "${REGION}" --project "${PROJECT}"\
    tasks clear -- test_dag_"$i";  

done



