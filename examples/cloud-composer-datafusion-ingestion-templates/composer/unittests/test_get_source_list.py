""" 
  Copyright 2021 Google LLC
 
  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at
 
    http://www.apache.org/licenses/LICENSE-2.0
 
  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
"""
import unittest
import sys
import os
from pathlib import Path
import importlib

sys.path.insert(1, '/Users/nehajo/projects/datalake-templates')
get_source_list = importlib.import_module("composer.unittests.dag-dependencies.get_source_list")
from get_source_list import get_source_list

class Test_Config_Available(unittest.TestCase):
    def test_config(self):

        systems = ["shipment"]
        print("current working directory(test_get_srource_list.py):"+ os.getcwd())

        for system in systems:
            dag_param_path = f"dag-parameters/{system}/load_shipment_dag_param.json"
            task_param_path = f"dag-parameters/{system}/load_shipment_task_param.json"
            env_param_path = f"dag-parameters/env_param.json"
            
            files = [dag_param_path, task_param_path, env_param_path]

            not_exists = [file for file in files if not Path(file).exists()]
            assert not not_exists, f"Files {not_exists} do/does not exist"

            # for file in files:
            #     assert Path(file).exists(), f"{file} does not exist!"
            get_source_list('shipment',"load_shipment_dag_param.json","load_shipment_task_param.json",'test_dag_run_id')
def main():
    test=Test_Config_Available()
    print("Checking if all config files are available and get_source_list is called successfully.")
    test.test_config()

if __name__ == "__main__":
    main()