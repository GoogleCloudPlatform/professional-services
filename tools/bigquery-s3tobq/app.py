import os
from typing import Dict
import yaml
import logging
from core.gcs import delete_file, upload_file
import datetime
from core import bq, gcs

from core.composer.client import ComposerClient

logging.basicConfig(level=logging.INFO)

AWS_SECRET_ACCESS_KEY = None
AWS_ACCESS_KEY_ID = None
GOOGLE_APPLICATION_CREDENTIALS = None


def load_aws_config() -> None:
    global AWS_ACCESS_KEY_ID
    global AWS_SECRET_ACCESS_KEY
    if not os.getenv('AWS_SECRET_ACCESS_KEY'):
        raise ValueError('Please setup `AWS_SECRET_ACCESS_KEY` environment variable.')
    AWS_SECRET_ACCESS_KEY = os.getenv('AWS_SECRET_ACCESS_KEY')
    if not os.getenv('AWS_ACCESS_KEY_ID'):
        raise ValueError('Please setup `AWS_ACCESS_KEY_ID` environment variable.')
    AWS_ACCESS_KEY_ID = os.getenv('AWS_ACCESS_KEY_ID')
    

def load_gcp_config() -> None:
    global GOOGLE_APPLICATION_CREDENTIALS
    if not os.getenv('GOOGLE_APPLICATION_CREDENTIALS'):
        raise ValueError('Please setup `GOOGLE_APPLICATION_CREDENTIALS` environment variable.')
    GOOGLE_APPLICATION_CREDENTIALS = os.getenv('GOOGLE_APPLICATION_CREDENTIALS')

def load_config(config_path: str) -> str:
    if config_path[:2] == 'gs':
        return gcs.read_file(config_path)
    return yaml.safe_load(open(config_path))


def run(config_path: str) -> None:
    load_aws_config()
    load_gcp_config()
    config = load_config(config_path)
    output_config = config['output']
    cloud_composer_config = config['cloud_composer']
    # TODO: automate creation of gcp side bucket
    # sts.create_immediate_one_time_aws_transfer(output_config['project_id'], 'kicking by code.',
    # 's3-to-bq-testing',AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY,'s3tobq_testing')
    # TODO: Automate deploying and packaging of cloud run container.
    create_gcs_trigger('test_trigger', 's3tobq_testing', 'helloworld-events',
        output_config['dataset_location'], GOOGLE_APPLICATION_CREDENTIALS['client_email'], output_config['project_id'],
        output_config['dataset_location'], 'trigger3')
    # client_id = get_client_id(output_config['project_id'], output_config['dataset_location'], 's3tobq-test-env1')
    # data = {}
    # trigger_dag(data, client_id, 'sf63d7817c7cff661p-tp', 'composer_sample_trigger_response_dag')
    # logging.info('Uploading DAG')
    # composer_client = ComposerClient(output_config['project_id'], output_config['dataset_location'], cloud_composer_config['environment_name'])
    # composer_client.upload_dag('./core/composer/bq_dag.py')

    # test_file = './test/data/sample_logs/lb/lb_sample.log'

    # uploaded_file_name = str(datetime.datetime.now()) + '_testfile'
    # logging.info('Uploading file: ', uploaded_file_name)
    # upload_file('s3tobq_testing', test_file, uploaded_file_name)

    # logging.debug('Getting data from BQ')
    # query = """
    #     SELECT *
    #     FROM {0}.{1}
    # """
    # query = query.format(output_config['dataset_name'], output_config['table_name'])
    # print(query)
    # rows = bq.run_query(query)
    # for row in rows:
    #     print(row)


if __name__=='__main__':
    print("Please execute main file.")