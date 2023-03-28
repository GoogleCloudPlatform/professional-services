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

from kfp.v2 import dsl
from typing import NamedTuple



@dsl.component(base_image='python:3.9',packages_to_install=["gcsfs","fsspec","interpret","pandas","scikit-learn","google-cloud-aiplatform","google-cloud-bigquery","db-dtypes","google-cloud-storage","google-cloud-bigquery","db-dtypes"],)
def model_validation(bucket_name:str,model_validation_root_path_temp:str,f1_score_threshold:str,project_id:str,location:str,mlops_version:str,experiment_name:str,gcs_source:str)-> NamedTuple('Outputs', [('is_model_valid', str),('f1_score_value',str)]):
                                    
    from collections import namedtuple
    from google.cloud import storage
    import os
    import pandas
    import joblib
    from sklearn.metrics import f1_score
    from google.cloud import aiplatform  
    import configparser
    
    is_model_valid="FALSE"
    
    config = configparser.ConfigParser()
    config.read('./VERTEX_AI/TRAINING_PIPELINE/config.ini')

    model_validation_root_path_temp="vertex-ai/model"
    model_name = "model.joblib"
    bucket_name = "mlops-experiment-v2-bucket"
    
    # download model
    storage_client = storage.Client(project="mlops-experiment-v2")
    bucket = storage_client.get_bucket(bucket_name)
    storage_path = os.path.join(model_validation_root_path_temp, model_name)
    blob = bucket.blob(storage_path)
    blob.download_to_filename(model_name)
    
    loaded_model = joblib.load(model_name)
    
    #GCS
    df=pandas.read_csv(gcs_source)
    
    df=df.drop(['location_source','location_destination','entity_type_graph','timestamp'], axis=1)
    labels = df.pop("link_predict").tolist()
    predicted_results=loaded_model.predict(df)
    
    f1_score_value = f1_score(labels, predicted_results)
    if f1_score_value>=float(f1_score_threshold):
        is_model_valid="TRUE"
    
    # Log experiment results
    aiplatform.init(experiment=experiment_name, project=project_id, location=location)
    aiplatform.start_run(run=mlops_version, resume=False)
    aiplatform.log_metrics({"f1_score":f1_score_value})
    aiplatform.end_run()
    
    stats_output = namedtuple('Outputs', ['is_model_valid','f1_score_value'])

    return stats_output(is_model_valid,str(f1_score_value))
