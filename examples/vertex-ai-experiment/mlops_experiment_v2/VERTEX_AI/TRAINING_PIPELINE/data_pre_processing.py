import logging
from kfp.v2 import compiler, dsl
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
        
    dataflow_wait_op =  WaitGcpResourcesOp(
                                gcp_resources = dataflow_python_op.outputs["gcp_resources"]
        )
    
    from collections import namedtuple
    stats_output = namedtuple('Outputs', ['is_preprocessing_complete'])

    return stats_output(is_preprocessing_complete)
