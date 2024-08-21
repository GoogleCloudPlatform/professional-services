import os

from flask import Flask, request
import composer
import gcs
import bq
import yaml

app = Flask(__name__)
CONFIG_FILE = 'config.yaml'


print('Here 2')
config = yaml.safe_load(open(CONFIG_FILE))
bq.create_dataset(
    config['output']['project_id'] + '.' + config['output']['dataset_name'],
    config['output']['dataset_location']
    )

bq.create_table(
    config['output']['project_id'] + '.' + config['output']['dataset_name'] + '.' + config['output']['intermediate_table_name'],
    [{'name': 'file_name', 'type': 'STRING', 'mode': 'REQUIRED'}, {'name': 'file_data', 'type': 'BYTES'}])

final_table_fields = config['output']['table_format']['fields']
bq.create_table(config['output']['project_id'] + '.' + config['output']['dataset_name'] + '.' + config['output']['table_name'], final_table_fields)


@app.route('/', methods=['POST'])
def index():
    print('Event received!')

    print('HEADERS:')
    headers = dict(request.headers)
    headers.pop('Authorization', None)  # do not log authorization header if exists
    print(headers)

    print('BODY:')
    body = dict(request.json)
    print(body)

    config = yaml.safe_load(open(CONFIG_FILE))
    output_config = config['output']
    composer_environment_name = config['cloud_composer']['environment_name']
    project_id = output_config['project_id']
    dataset_location = output_config['dataset_location']
    sql = gcs.read_file(output_config['load_file'])
    
    data = {
        'bucket': body['bucket'],
        'file': body['name'],
        'project_id': project_id,
        'dataset_name': output_config['dataset_name'],
        'intermediate_table_name': output_config['intermediate_table_name'],
        'dataset_location': dataset_location,
        'sql': sql,
        }
    
    composer.trigger_dag(
        project_id=project_id,
        location=dataset_location,
        environment_name=composer_environment_name,
        dag_id='load_file_into_bigquery',
        data=data
    )

    resp = {
        "headers": headers,
        "body": body
    }
    return (resp, 200)

if __name__ == "__main__":
    print('Here 1')
    print('Here 3')
    app.run(debug=True, host='0.0.0.0', port=int(os.environ.get('PORT', 8080)))
    print('Here 4')