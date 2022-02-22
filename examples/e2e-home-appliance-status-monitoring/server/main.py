# Copyright 2019 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""HTTPS Server accepting active power readings.

This file implements a HTTPS server, it is deployed in GAE.

"""
import base64
import json
import logging
import os
from flask import Flask
from flask import request
import googleapiclient.discovery
import google.cloud.bigquery
import google.cloud.pubsub_v1
logging.basicConfig(level=logging.DEBUG)

PROJECT_ID = os.environ['GOOGLE_CLOUD_PROJECT']
MODEL_NAME = os.environ['MODEL_NAME']
DATASET_ID = os.environ['DATASET_ID']
SEQ_LEN = int(os.environ['SEQ_LEN'])
PUB_TOPIC = os.environ['PUB_TOPIC']
FEAT_COLS = ['ActivePower_{}'.format(i) for i in range(1, SEQ_LEN + 1)]

app = Flask(__name__)
ml_service = googleapiclient.discovery.build('ml', 'v1')
bq_client = google.cloud.bigquery.Client()
publisher = google.cloud.pubsub_v1.PublisherClient()
topic_path = publisher.topic_path(PROJECT_ID, PUB_TOPIC)


@app.route('/upload', methods=['POST'])
def process_msg():
  """Process the incoming request.

  Example of an incoming json message:
  {
      "message": {"data": {"timestamp": ["2018-10-30 00:00:00", ...],
                           "power": [111.0, ...]}},
      ...
  }

  The message is a json data, we should
  1. write the json data to BQ
  2. forward the json data to CMLE
  3. write the prediction to BQ

  Returns:
    (str, int), message and HTTP code.
  """
  try:
    envelope = json.loads(request.data.decode('utf-8'))
    payload = base64.b64decode(envelope['message']['data'])
    data = json.loads(payload, encoding='utf-8')
    time_stamp = data['timestamp']
    active_power = data['power']
    device_id = data['device_id']
    logging.info('0. Got msg from device: {}'.format(device_id))

    # forward the data to CMLE
    instance = {k:v for k, v in zip(FEAT_COLS, active_power)}
    response = ml_service.projects().predict(
        name='projects/{}/models/{}'.format(PROJECT_ID, MODEL_NAME),
        body={'instances': [instance]}
    ).execute()
    logging.info('1. CMLE returned: {}'.format(response))
    preds = response['predictions'][0]
    probs = preds['probabilities']

    # publish the result
    data = {'device_id': device_id,
            'probs': probs,
            'data': active_power,
            'time': time_stamp}
    data = json.dumps(data).encode('utf-8')
    publisher.publish(topic_path, data=data)
    logging.info('2. Result published: {}'.format(data))

    # write data to BQ
    query = ('INSERT INTO EnergyDisaggregation.ActivePower (time, device_id, power) '
             'VALUES (timestamp("{}"), "{}", {});'.format(
                 time_stamp[-1], device_id, active_power[-1]))
    query_job = bq_client.query(query)
    _ = query_job.result()
    logging.info('3. Query executed: {}'.format(query))

    # write CMLE result to BQ
    table_ref = bq_client.dataset(DATASET_ID).table('Predictions')
    table = bq_client.get_table(table_ref)
    rows_to_insert = [
        (time_stamp[-1], device_id, i, int(prob > 0.5), prob)
        for i, prob in enumerate(probs)
    ]
    errors = bq_client.insert_rows(table, rows_to_insert)
    logging.info('4. Resultes recorded: {}'.format(rows_to_insert))
    if errors:
      raise ValueError('{}'.format(errors))

    # ack
    return 'OK', 200
  except Exception as e:
    logging.info('Error: {}'.format(e))
    return 'Error', 201


if __name__ == '__main__':
  app.run(host='127.0.0.1', port=8080)
