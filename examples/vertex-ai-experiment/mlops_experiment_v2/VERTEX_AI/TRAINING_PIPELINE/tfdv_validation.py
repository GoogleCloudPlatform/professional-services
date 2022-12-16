import logging
from kfp.v2 import compiler, dsl
from typing import NamedTuple

# TFDV Custom componets
@dsl.component(
    base_image='python:3.9', packages_to_install=["google-cloud-bigquery","db-dtypes","tensorflow_data_validation","pandas","gcsfs","fsspec"])
def generate_statistics(output_gcs_path:str,project:str,gcs_source:str)-> NamedTuple('Outputs', [('is_valid', str)]):
    import tensorflow_data_validation as tfdv
    from tensorflow_data_validation.utils import display_util, schema_util, stats_util, anomalies_util
    from collections import namedtuple
    from google.cloud import bigquery
    import json
    import pandas
    
    is_valid="TRUE"
    # define path
    statistics_output_path = f'{output_gcs_path}/stats.pbtxt'
    schema_output_path = f'{output_gcs_path}/schema.pbtxt'
    validate_schema_path=f'{output_gcs_path}/schema.pbtxt'
    anomalies_output_path=f'{output_gcs_path}/anomalies.pbtxt'
    
    # GCS
    df=pandas.read_csv(gcs_source)
    
    # Generate Stats
    stats = tfdv.generate_statistics_from_dataframe(df)
    stats_util.write_stats_text(stats, output_path=statistics_output_path)

    # Data Validation
    schema = tfdv.infer_schema(stats)
    schema.default_environment.append('TRAINING')
    schema.default_environment.append('SERVING')
    tfdv.get_feature(schema, 'link_predict').not_in_environment.append('SERVING')
    schema_util.write_schema_text(schema, output_path=schema_output_path)
    
    # check if schema is created previously to validate
    try:
        valid_schema = schema_util.load_schema_text(validate_schema_path)
         # check if any anomaly
        anomalies = tfdv.validate_statistics(stats, valid_schema, environment='TRAINING')
        if anomalies.anomaly_info:
            logging.info(anomalies.anomaly_info)
            anomalies_output_path = f'{output_gcs_path}/anomalies.pbtxt'
            logging.info(f'ANOMALY DETECTED : Write anomalies file [{anomalies_output_path}]')
            anomalies_util.write_anomalies_text(anomalies, output_path=anomalies_output_path)
            is_valid="FALSE"
    except Exception as e:
        # Generate Schema if not exists. 
        schema_util.write_schema_text(schema, output_path=schema_output_path)
        # As there is not valid schema present.
        valid_schema=schema


    # display the statistics report in KFP UI
    html = display_util.get_statistics_html(stats)
    # Return Stats HTML to visualise
    metadata = {
        'outputs': [{
            'type': 'web-app',
            'storage': 'inline',
            'source': html
        }]
    }
    stats_output = namedtuple('Outputs', ['is_valid'])
    return stats_output(is_valid)
