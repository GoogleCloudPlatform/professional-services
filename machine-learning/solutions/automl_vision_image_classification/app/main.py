# Copyright 2018 Google Inc. All Rights Reserved.
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

import base64
from datetime import datetime
import logging
import os
from oauth2client.client import GoogleCredentials
from google.cloud import datastore
from google.cloud import storage
from googleapiclient import discovery
from flask import Flask
from flask import redirect
from flask import render_template
from flask import request


PROJECT_ID = os.environ.get('PROJECT_ID')
CLOUD_STORAGE_BUCKET = os.environ.get('CLOUD_STORAGE_BUCKET')
MODEL_NAME = os.environ.get('MODEL_NAME')
MODEL_VERSION = os.environ.get('MODEL_VERSION')

app = Flask(__name__)


@app.route('/')
def homepage():
  """Renders homepage."""
  # Creates a Cloud Datastore client.
  datastore_client = datastore.Client()
  # Uses the Cloud Datastore client to fetch information about each image.
  query = datastore_client.query(kind='Image')
  image_entities = list(query.fetch())
  # Returns an HTML template and passes in image_entities as a parameter.
  return render_template('homepage.html', image_entities=image_entities)


@app.route('/upload_photo', methods=['GET', 'POST'])
def upload_photo():
  """Uploads a photo, predicts its category and stores in Datastore."""
  photo = request.files['file']
  # Creates a Cloud Storage client.
  storage_client = storage.Client()
  # Gets the bucket that the file will be uploaded to.
  bucket = storage_client.get_bucket(CLOUD_STORAGE_BUCKET)
  # Creates a new blob and upload the file's content.
  blob = bucket.blob(photo.filename)
  content = photo.read()
  blob.upload_from_string(content, content_type=photo.content_type)
  # Makes the blob publicly viewable.
  blob.make_public()
  # Gets your application credentials.
  credentials = GoogleCredentials.get_application_default()
  # Builds a Python representation of the API.
  ml_service = discovery.build('ml', 'v1', credentials=credentials)

  def get_prediction(instance, project, model, version):
    """Gets prediction from the deployed model."""
    name = 'projects/{}/models/{}'.format(project, model)
    if version:
      name += '/versions/{}'.format(version)
    request_dict = {'instances': [instance]}
    request_job = ml_service.projects().predict(name=name, body=request_dict)
    return request_job.execute()  # Waits till request is returned.

  # Creates and sends a request to get prediction.
  instance = {'key': '0',
              'image_bytes': {'b64': base64.b64encode(content).decode()}}
  predictions = get_prediction(instance, PROJECT_ID, MODEL_NAME, MODEL_VERSION)
  # Gets the most likely prediction.
  labels = predictions['predictions'][0]['labels']
  scores = predictions['predictions'][0]['scores']
  max_score = 0
  for label, score in zip(labels, scores):
    if score > max_score:
      prediction = label
      max_score = score

  # Converts label string.
  if prediction == '--other--':
    prediction = 'Unknown'

  # Creates a Cloud Datastore client.
  datastore_client = datastore.Client()
  # Fetches the current date / time.
  current_datetime = datetime.now()
  # The kind for the new entity.
  kind = 'Image'
  # The name/ID for the new entity.
  name = blob.name
  # Creates the Cloud Datastore key for the new entity.
  key = datastore_client.key(kind, name)
  # Constructs the new entity and sets the values for its property values.
  entity = datastore.Entity(key)
  entity['blob_name'] = blob.name
  entity['image_public_url'] = blob.public_url
  entity['timestamp'] = current_datetime
  entity['predictions'] = predictions
  entity['prediction'] = prediction
  # Saves the new entity to Datastore.
  datastore_client.put(entity)
  # Redirects to the home page.
  return redirect('/')


@app.errorhandler(500)
def server_error(e):
  """Logs server errors."""
  logging.exception('An error occurred during a request.')
  return """
  An internal error occurred: <pre>{}</pre>
  See logs for full stacktrace.
  """.format(e), 500


if __name__ == '__main__':
  # This is used when running locally. Gunicorn is used to run the
  # application on Google App Engine. See entrypoint in app.yaml.
  app.run(host='127.0.0.1', port=8080, debug=True)
