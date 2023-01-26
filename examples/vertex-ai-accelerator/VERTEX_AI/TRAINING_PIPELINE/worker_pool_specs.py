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
    
