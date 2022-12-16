import logging
import argparse
from apache_beam.options.pipeline_options import PipelineOptions
from apache_beam.options.pipeline_options import SetupOptions
from apache_beam.dataframe.convert import to_pcollection,to_dataframe
import apache_beam as beam

from collections import defaultdict


def tfdv(df):
    import tensorflow_data_validation as tfdv
    from tensorflow_data_validation.utils import display_util, schema_util, stats_util, anomalies_util
    
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
        schema_util.write_schema_text(schema, output_path=validate_schema_path)
        valid_schema=schema

    yield df

def create_graph(df):
    logging.info('GRAPH is created.')
    yield df

def create_features(df):
    logging.info('GRAPH FEATURES is created.')
    yield df

def update_features_store(df):
    import pandas
    import numpy as np
    PROJECT_ID="mlops-experiment-v2"
    REGION="us-central1"
    FEATURESTORE_ID="mlops_experiment_feature_store"
    # Dataframe cleanup
    df.columns= df.columns.str.lower()
    df['entity_id'] = np.arange(df.shape[0])
    df['entity_id'] = df['entity_id'].astype(str)
    df['link_predict']=df['link_predict'].replace(['YES'], True)
    df['link_predict']=df['link_predict'].replace(['NO'], False)
    
    logging.info("Pandas df length {0}".format(len(df)))
    from datetime import datetime, timedelta
    from google.cloud.aiplatform import Feature, Featurestore 
    fs = Featurestore(
            featurestore_name=FEATURESTORE_ID,
            project=PROJECT_ID,
            location=REGION,
        )
    graph_entity_type=fs.get_entity_type('graph')
    current_time_stamp=datetime.now()
    current_time_stamp_feature_store=current_time_stamp.isoformat(sep=" ", timespec="milliseconds")
    
    feature_time_str =current_time_stamp.isoformat(sep=" ", timespec="milliseconds")
    graph_entity_type.ingest_from_df(
            feature_ids=["location_source","location_destination","feature_1_score", "feature_2_score", "feature_3_score","feature_4_score", "feature_5_score", "feature_6_score","feature_7_score", "feature_8_score", "feature_9_score", "feature_10_score","link_predict"],
            feature_time= datetime.strptime(current_time_stamp_feature_store, "%Y-%m-%d %H:%M:%S.%f"),
            df_source=df,
            entity_id_field="entity_id",
        )
    
    
    # Feature Store entityid, timestamp for batch serving.
    feature_id_timestamp_df=pandas.DataFrame()
    feature_id_timestamp_df['graph']=df['entity_id'].astype(str)
    feature_id_timestamp_df['timestamp']=pandas.to_datetime(datetime.now(), format="%Y-%m-%dT%H:%M:%SZ")
    feature_id_timestamp_df.to_csv("read_instances_uri.csv",index=False)
    
    #upload file to GCS
    from google.cloud import storage
    import os
    storage_client = storage.Client(project="mlops-experiment-v2")
    blob = storage.blob.Blob.from_string("gs://mlops-experiment-v2-bucket/feature_store/read_instances_uri.csv", client=storage_client)
    blob.upload_from_filename("read_instances_uri.csv")
    print("Uploaded ML Model to GCS")
    logging.info("finish_bundle")
    
    logging.info('Update to FEATURE STORE.')
    yield df

def validate_graph_entity_tfdv(df):
    import tensorflow_data_validation as tfdv
    from tensorflow_data_validation.utils import display_util, schema_util, stats_util, anomalies_util
    
    validate_schema_path=f'gs://mlops-experiment-v2-bucket/tfdv/dataflow_raw_data_schema.pbtxt'
    
    stats = tfdv.generate_statistics_from_dataframe(df)
    schema = tfdv.infer_schema(stats)
    schema.default_environment.append('TRAINING')
    
    try:
        valid_schema = schema_util.load_schema_text(validate_schema_path)
        anomalies = tfdv.validate_statistics(stats, valid_schema, environment='TRAINING')
        if anomalies.anomaly_info:
            logging.info('ANOMALY DETECTED IN ENTITY DATA SAMPLES.')
    except Exception as e:
        schema_util.write_schema_text(schema, output_path=validate_schema_path)
        valid_schema=schema

    yield df

def print_2_dataframe(df):
    from apache_beam.dataframe.convert import to_pcollection,to_dataframe
    logging.info('dataframe in print_2_dataframe head - {}'.format(df.to_string()))
    yield str(len(df))

class CreateDataFrame(beam.DoFn):
    import pandas
    
    def __init__(self):
        import pandas
        self.data=defaultdict(list)
        self.dataframe=pandas.DataFrame()
        self.window = beam.transforms.window.GlobalWindow()

    def process(self, row):
        logging.info("Processing Row..")
        for key,value in row.items():
            self.data[key].append(value)
  
 
    def finish_bundle(self):
        import pandas
        from apache_beam.dataframe.convert import to_pcollection
        import apache_beam as beam
        self.dataframe=pandas.DataFrame(data=self.data)
        logging.info('dataframe head - {}'.format(self.dataframe.to_string()))
        yield beam.utils.windowed_value.WindowedValue(
            value=self.dataframe,
            timestamp=0,
            windows=[self.window],
        ) 



      
def run(argv=None, save_main_session=True):
    
      # Create Setup.py file in to local folder.
    setup_python_file_string="""
from setuptools import setup, find_packages

setup(name='magneto-dataflow-setup',
        version='0.1',
        description='Dependencies',
        install_requires=[
        'apache-beam==2.41.0',
        'tensorflow_data_validation==1.11.0',
        'google-cloud-aiplatform==1.19.0',
        'pandas',
        'numpy'],
        packages = find_packages()
        )"""
    f = open("./setup.py", "w")
    f.write(setup_python_file_string)
    f.close()
    
    parser = argparse.ArgumentParser()
    known_args, pipeline_args = parser.parse_known_args(argv)
    
    pipeline_options = PipelineOptions(pipeline_args,job_name="dataflow-experiment-mlops")
    pipeline_options.view_as(SetupOptions).save_main_session = save_main_session
    pipeline_options.view_as(SetupOptions).setup_file = './setup.py'
    
    # Read data from BQ
    QUERY='SELECT * FROM `mlops-experiment-v2.mlops_experiment_v2.training_dataset`'
    BQ_source = beam.io.BigQuerySource(query = QUERY,use_standard_sql=True)
    
    
    with beam.Pipeline(options=pipeline_options) as p:
        dataframe=(p 
                      | '1. Read BQ Raw Data' >> beam.io.Read(BQ_source)
                      | '2. Create Dataframe' >> beam.ParDo(CreateDataFrame())
                  )
        raw_validate_data=(dataframe
                            | '3.1 Validate Raw Data' >> beam.FlatMap(tfdv)
                          )
        raw_data=(dataframe
                      | '3.2 Print Dataframe' >> beam.FlatMap(print_2_dataframe)
                 )
        graph=(raw_validate_data
                      | '4. Create a Graph' >> beam.FlatMap(create_graph)
                 )
        graph_features=(graph
                      | '5. Create a Graph Features' >> beam.FlatMap(create_features)
                 )
        validated_graph_features=(graph_features
                      | '6. Validate Entity Data Frames using TFDV' >> beam.FlatMap(validate_graph_entity_tfdv)
                 )
        feature_store_updated=(validated_graph_features
                      | '7. Store Values to Feature Store' >> beam.FlatMap(update_features_store)
                 )
        
        
                  
if __name__ == '__main__':
  logging.getLogger().setLevel(logging.INFO)
  run()
