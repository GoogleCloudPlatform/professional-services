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

import logging

def tensor_flow_data_validation(df):
    logging.info('inside tensor_flow_data_validation')
    import tensorflow_data_validation as tfdv
    from tensorflow_data_validation.utils import  schema_util
    
    validate_schema_path=f'gs://mlops-experiment-v2-bucket/tfdv/dataflow_raw_data_schema.pbtxt'
    
    stats = tfdv.generate_statistics_from_dataframe(df)
    schema = tfdv.infer_schema(stats)
    schema.default_environment.append('TRAINING')
    
    try:
        valid_schema = schema_util.load_schema_text(validate_schema_path)
        anomalies = tfdv.validate_statistics(stats, valid_schema, environment='TRAINING')
        if anomalies.anomaly_info:
            logging.info('ANOMALY DETECTED IN RAW DATA SAMPLES.')
    except Exception as e:
        logging.error(str(e))
        schema_util.write_schema_text(schema, output_path=validate_schema_path)
        valid_schema=schema

    return df