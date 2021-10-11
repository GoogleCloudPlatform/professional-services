# Copyright 2021 Google LLC. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import os
import logging

import flask
import lightgbm as lgb
import numpy as np
import pandas as pd
from google.cloud import storage

logging.getLogger().setLevel(logging.INFO)

################################################################################
# model load code
################################################################################

# Need to set env parameter through
# model_serving_container_environment_variables={'TRAINING_DATA_SCHEMA':
# data_schema},
DATA_SCHEMA = os.environ['TRAINING_DATA_SCHEMA']
features = [field.split(':') for field in DATA_SCHEMA.split(';')][0:-1]
feature_names = [item[0] for item in features]
logging.info(f'feature schema: {features}')

MODEL_FILENAME = os.environ['MODEL_FILENAME']
logging.info(f'model file name: {MODEL_FILENAME}')


def load_model(model_store):
  gcs_model_path = os.path.join(model_store, MODEL_FILENAME)

  client = storage.Client()
  local_file_path = '/tmp/local_model.txt'
  with open(local_file_path, 'wb') as f:
    client.download_blob_to_file(gcs_model_path, f)
  return lgb.Booster(model_file=local_file_path)


if 'AIP_STORAGE_URI' not in os.environ:
  raise KeyError(
    'The `AIP_STORAGE_URI` environment variable has not been set. ' +
    'See https://cloud.google.com/ai-platform-unified/docs/predictions/custom-container-requirements#artifacts'
  )
logging.info(f'AIP_STORAGE_URI: {os.environ["AIP_STORAGE_URI"]}')
model = load_model(os.environ['AIP_STORAGE_URI'])

################################################################################
# Run the inference server
################################################################################

app = flask.Flask(__name__)


@app.route('/predict', methods=['POST'])
def predict():
  """
  For direct API calls through request
  """
  data = flask.request.get_json(force=True)
  logging.info(f'prediction: received requests containing '
               f'{len(data["instances"])} records')

  df = pd.json_normalize(data['instances'])[feature_names]

  # Replace None with NaN
  df = df.fillna(value=np.nan)

  # Encode categorical features.
  for field in features:
    df[field[0]] = df[field[0]].astype(field[1])

  predictions = model.predict(df)

  output = [{
    'confidences': [y, 1 - y],
    'displayNames': ['1', '0']
  } for y in predictions.tolist()]

  response_dict = {
    'predictions': output
  }

  return flask.make_response(flask.jsonify(response_dict), 200)


@app.route('/health', methods=['GET', 'POST'])
def health():
  """
  For direct API calls through request
  """
  status_code = flask.Response(status=200)
  return status_code


if __name__ == "__main__":
  logging.info('prediction container starting up')

  port = int(os.getenv('AIP_HTTP_PORT', '8080'))
  logging.info(f'http port: {port}')

  app.run(host="0.0.0.0", port=port)
