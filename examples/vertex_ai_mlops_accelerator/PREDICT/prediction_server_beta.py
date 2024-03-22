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

from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
from google.cloud import storage
import os
import pandas
import configparser

print("Prediction Server is starting...")

app = Flask(__name__)
CORS(app)

print("Loading Configuration...")
config = configparser.ConfigParser()
config.read('config.ini')

model_validation_root_path_temp=config.get('ML','MODEL_VALIDATION_ROOT_PATH_TEMP')
model_name = config.get('ML','MODEL_NAME')
bucket_name = config.get('ML','BUCKET_NAME')

from logging.config import dictConfig

dictConfig({
    'version': 1,
    'formatters': {'default': {
        'format': '[%(asctime)s] %(levelname)s in %(module)s: %(message)s',
    }},
    'handlers': {'wsgi': {
        'class': 'logging.StreamHandler',
        'stream': 'ext://flask.logging.wsgi_errors_stream',
        'formatter': 'default'
    }},
    'root': {
        'level': 'INFO',
        'handlers': ['wsgi']
    }
})

AIP_HEALTH_ROUTE = os.environ.get('AIP_HEALTH_ROUTE', '/health')
AIP_PREDICT_ROUTE = os.environ.get('AIP_PREDICT_ROUTE', '/predict')

IS_MODEL_READY=False
loaded_model=None
# Download model from Cloud Storage.
def download_model_file():
    print("Downloading Model...")
    storage_client = storage.Client(project="mlops-experiment-v2")
    bucket = storage_client.get_bucket(bucket_name)
    storage_path = os.path.join(model_validation_root_path_temp, model_name)
    blob = bucket.blob(storage_path)
    blob.download_to_filename(model_name)
    print("Downloaded Model...")


# Health check route
@app.route(AIP_HEALTH_ROUTE)
def is_alive():
    if IS_MODEL_READY:
        print("/isalive request")
        status_code = 200
        return jsonify({'health': 'ok'}),status_code
    else:
        print("/isalive request")
        status_code = 503
        return jsonify({'health': 'ok'}),status_code

def pre_process_instances(df):
    if len(df.columns)>10:
        df=df.iloc[: , 2:]
    return df

# Predict route
@app.route(AIP_PREDICT_ROUTE, methods=["POST"])
def predict():
    try:
        req_json = request.get_json()
        print("/predict request")
        if IS_MODEL_READY:
            status_code=200
            json_instances = req_json["instances"]
            df=pandas.DataFrame(data=req_json["instances"])
            df=pre_process_instances(df)
            predicted_results=loaded_model.predict(df)
            print("json_instances",json_instances)
            print("predicted_results",predicted_results)
            return jsonify({
                "predictions": predicted_results.tolist()
            }),status_code
        else:
            print("/predict request")
            status_code = 503
            return jsonify({'predictions': []}),status_code
    except Exception as e:
        status_code = 500
        return jsonify({'predictions': str(req_json),'error':str(e)}),status_code
        
if __name__ == "__main__":
    print("Downloading model...")
    download_model_file()
    print("Loading model...")
    loaded_model = joblib.load(model_name)
    IS_MODEL_READY=True
    print("Loading model is complete...")
    app.run(debug=True, host="0.0.0.0", port=8080)