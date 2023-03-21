# Copyright 2023 Google LLC
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
"""Cloud Function to serve as the prediction endpoint."""

import os
import sys
import json
import logging
from google.cloud import aiplatform as vertex_ai


# To enable the Cloud Function to work out the
# next import
workdir = '/workspace'
if not workdir in sys.path:
    sys.path.append(workdir)

from src.feature_store import feature_store as fs


# if the trigger is HTTP, the argument is a request
def predict(request):
    
    def getenv(env_var_name):
        v = os.getenv(env_var_name)
        if not v:
            raise ValueError(f"Environment variable {env_var_name} is not set.")
        return v
    
    project = getenv("PROJECT")
    region = getenv("REGION")
    endpoint_name = getenv("ENDPOINT_NAME")
    entity = getenv("ENTITY")
    store_id = getenv("FEATURESTORE_ID")
        
    default_v27 = 0.
    default_v28 = 0.
    
    raw_features = request.get_json(silent=False)
    logging.error(f"Raw features: {raw_features}")
    
    # Get userid and query Feature Store
    fs_features = {} 
    
    if 'userid' in raw_features:
        try:
            fs_features = fs.read_features(project, region, store_id, entity, ['v27', 'v28'], raw_features['userid'])
        except:
            logging.warn("Feature store is not available")
        if not 'v27' in fs_features:
            logging.error(f'User {raw_features["userid"]} not present in Feature Store, using defaults') 
            fs_features['v27'] = default_v27
        if not 'v28' in fs_features:
            fs_features['v28'] = default_v28
    else:
        logging.error('No userid provided, using defaults')
        return {'error': 'No userid'}

    if 'V1' not in raw_features:
        return {'error': 'Missing features. Expect V1 to V26 and userid.'}
    
    feature_data = raw_features.copy()
    del feature_data['userid']
    feature_data['V27'] = [fs_features['v27']]
    feature_data['V28'] = [fs_features['v28']]
    
    # Query model on Vertex AI Endpoint
    endpoint = vertex_ai.Endpoint(endpoint_name, project, region)
    logging.error(f"Calling endpoint with: {feature_data}")
    prediction = endpoint.predict([feature_data]).predictions[0]
    logging.error(f"Prediction: {prediction}")
    
    return json.dumps(prediction)


