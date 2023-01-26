from kfp.v2 import  dsl
from typing import NamedTuple

@dsl.component(
    base_image='python:3.9',
    packages_to_install=['google-cloud-aiplatform',"google-cloud-bigquery","db-dtypes","google-cloud-storage"],)
def load_features_batch_to_gcs(read_instances_csv:str,feature_store_id:str,mlops_pipeline_version:str) ->  NamedTuple('Outputs', [('gcs_destination_output_uri_paths', str),('gcs_destination_dataset_list_of_csv_files', str)]):
    
    from google.cloud import aiplatform  
    import json
    
    # Load Values
    fs = aiplatform.featurestore.Featurestore(featurestore_name=feature_store_id)
    SERVING_FEATURE_IDS = {
        "graph": ["location_source","location_destination","feature_1_score", "feature_2_score", "feature_3_score","feature_4_score", "feature_5_score", "feature_6_score","feature_7_score", "feature_8_score", "feature_9_score", "feature_10_score","link_predict"]
    }
    # GCS
    gcs_destination_output_uri_prefix="gs://mlops-experiment-v2-bucket/data/{0}".format(mlops_pipeline_version)
    fs.batch_serve_to_gcs(
         gcs_destination_output_uri_prefix=gcs_destination_output_uri_prefix,
         gcs_destination_type="csv",
         serving_feature_ids=SERVING_FEATURE_IDS,
         read_instances_uri=read_instances_csv
    )
    
    # get csv files path
    from google.cloud import storage
    storage_client = storage.Client(project="mlops-experiment-v2")
    bucket = storage_client.get_bucket("mlops-experiment-v2-bucket")
    blobs_specific = list(bucket.list_blobs(prefix='data/{0}'.format(mlops_pipeline_version)))
    gcs_destination_dataset_list_of_csv_files=[]    
    for blob in blobs_specific:
        gcs_destination_dataset_list_of_csv_files.append("gs://mlops-experiment-v2-bucket/"+blob.name)
    
    gcs_destination_dataset_list_of_csv_files=json.dumps(gcs_destination_dataset_list_of_csv_files)
    
    gcs_destination_output_uri_paths = f'{gcs_destination_output_uri_prefix}/*.csv'
    component_outputs = NamedTuple("Outputs",
                                [("gcs_destination_output_uri_paths", str),('gcs_destination_dataset_list_of_csv_files',str)],)
    
    return component_outputs(gcs_destination_output_uri_paths,gcs_destination_dataset_list_of_csv_files)

    
    