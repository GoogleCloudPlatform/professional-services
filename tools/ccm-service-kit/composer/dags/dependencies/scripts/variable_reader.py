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

import json

def getVariables():

    """
    This function read a json file and return all the values.
    """

    #Replace the path with your default location in gcs keeping the /home/airflow/gcs/ structure
    with open('/home/airflow/gcs/dags/dependencies/variables/variables.json') as f:
        variables = json.load(f)

    return variables