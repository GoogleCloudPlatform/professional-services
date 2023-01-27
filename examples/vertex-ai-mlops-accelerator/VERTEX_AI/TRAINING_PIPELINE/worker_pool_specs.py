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
def worker_pool_specs_op(gcs_destination_output_uri_paths:str)-> NamedTuple('Outputs', [('worker_pool_specs', list)]):
    
    from collections import namedtuple
    
    worker_pool_specs = [{
            "machine_spec": {
                "machine_type": "e2-highmem-2"
            },
            "replica_count": 1,
            "container_spec": {
                "image_uri": "us-central1-docker.pkg.dev/mlops-experiment-v2/mlops-experiment-v2/hyperparameter_tunning:base",
                "env":[{"name":"TRAINING_DATASET","value":gcs_destination_output_uri_paths},
                        {"name":"DATASET_SPLIT_PERCENTAGE","value":"0.1"}]
            
            }
        }]
    
 
    
    stats_output = namedtuple('Outputs', ['worker_pool_specs'])

    return stats_output(worker_pool_specs)
    
