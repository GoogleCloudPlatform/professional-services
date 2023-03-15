# Copyright 2022 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import json
import os
import shutil
import fileinput

config_filepath = '../include/dag_config/'
dag_template_filename = '../include/dag_template.py'

for filename in os.listdir(config_filepath):
    with open(config_filepath + filename) as f:
        config = json.load(f)
        new_filename = '../dags/' + config['DagId'] + '.py'
        shutil.copyfile(dag_template_filename, new_filename)

        with fileinput.input(new_filename, inplace=True) as file:
            for line in file:
                new_line = line.replace('\'dag_id_to_replace\'', "'" + config['DagId'] + "'") \
                    .replace('\'cluster_name_to_replace\'', "'" + config['ClusterName'] + "'") \
                    .replace('\'spark_job_name_to_replace\'', "'" + config['SparkJob'] + "'") \
                    .replace('\'year_to_replace\'',  config['StartYear'] ) \
                    .replace('\'month_to_replace\'',  config['StartMonth'] ) \
                    .replace('\'day_to_replace\'', config['StartDay'] ) \
                    .replace('\'machine_type_to_replace\'', "'" + config['ClusterMachineType'] + "'") \
                    .replace('\'idle_delete_ttl_to_replace\'', config['ClusterIdleDeleteTtl']) \
                    .replace('\'catchup_to_replace\'', config['Catchup']) \
                    .replace('\'schedule_to_replace\'', config['Schedule'])
                print(new_line, end='')
