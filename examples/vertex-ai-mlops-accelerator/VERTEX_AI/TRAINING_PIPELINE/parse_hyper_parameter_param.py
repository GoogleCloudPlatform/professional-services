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


@dsl.component(base_image='python:3.9')
def parse_hyper_parameter_param(best_trial_task:str,model_name:str,model_validation_root_path_temp:str,bucket_name:str,gcs_source:str)-> NamedTuple('Outputs', [('hyper_parameter_dict', str)]):
                                    
    from collections import namedtuple
    import json
    hyper_parameter_dict={"min_samples_leaf":None,
                          "max_leaves":None,
                          "model_name":model_name,
                          "model_validation_root_path_temp":model_validation_root_path_temp,
                          "bucket_name":bucket_name,
                          "training_gcs_url":gcs_source}
    print("best_trial_task")
    print(best_trial_task)
    best_hyper_parameters=json.loads(best_trial_task)["parameters"]
    for best_hyper_parameter in best_hyper_parameters:
        hyper_parameter_dict[best_hyper_parameter['parameterId']]=best_hyper_parameter['value']
    
    hyper_parameter_dict=json.dumps(hyper_parameter_dict)
    stats_output = namedtuple('Outputs', ['hyper_parameter_dict'])

    return stats_output(hyper_parameter_dict)
