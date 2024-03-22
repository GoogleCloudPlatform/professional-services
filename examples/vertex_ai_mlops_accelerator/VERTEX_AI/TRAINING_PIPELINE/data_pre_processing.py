#  Copyright 2023 Google LLC

#  Licensed under the Apache License, Version 2.0 (the "License");
#  you may not use this file except in compliance with the License.
#  You may obtain a copy of the License at

#      http://www.apache.org/licenses/LICENSE-2.0

#  Unless required by applicable law or agreed to in writing, software
#  distributed under the License is distributed on an "AS IS" BASIS,
#  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#  See the License for the specific language governing permissions and
#  limitations under the License.


from kfp.v2 import  dsl
from typing import NamedTuple


@dsl.component(
    base_image='python:3.9', packages_to_install=["google-cloud-pipeline-components==1.0.28"])
def data_pre_processing(is_preprocessing:str,project_id:str,location:str,dataflow_python_file:str,dataflow_root_path_temp:str,dataflow_requirements_file:str)-> NamedTuple('Outputs', [('is_preprocessing_complete', str)]):
    from google_cloud_pipeline_components.experimental.dataflow import DataflowPythonJobOp
    from google_cloud_pipeline_components.experimental.wait_gcp_resources import \
        WaitGcpResourcesOp
    is_preprocessing_complete="TRUE"
    print(is_preprocessing)
    #if str(is_preprocessing)=="TRUE":
    dataflow_python_op = DataflowPythonJobOp(
                                project=project_id,
                                location=location, 
                                python_module_path=dataflow_python_file,
                                temp_location = dataflow_root_path_temp,
                                requirements_file_path = dataflow_requirements_file
        )
        
    WaitGcpResourcesOp(
                                gcp_resources = dataflow_python_op.outputs["gcp_resources"]
        )
    
    from collections import namedtuple
    stats_output = namedtuple('Outputs', ['is_preprocessing_complete'])

    return stats_output(is_preprocessing_complete)
