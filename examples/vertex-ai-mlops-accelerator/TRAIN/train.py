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

from google.cloud import storage
from interpret.glassbox import ExplainableBoostingClassifier
import os
import numpy as np
from joblib import dump
import pandas as pd

import configparser
SEED=100
print("1 : Getting Config ")

config = configparser.ConfigParser()
config.read('config.ini')
model_validation_root_path_temp=config.get('ML','MODEL_VALIDATION_ROOT_PATH_TEMP')
model_name = config.get('ML','MODEL_NAME')
bucket_name = config.get('ML','BUCKET_NAME')

from sklearn.metrics import classification_report, confusion_matrix

print("1 : Started Training ")
storage_client = storage.Client(project="mlops-experiment-v2")

print("2 : Downloading Training Data")
print("Enviornment Variables {0}".format(str(os.environ)))
# These environment variables are from Vertex AI managed datasets
training_data_uri = os.environ["AIP_TRAINING_DATA_URI"]
test_data_uri = os.environ["AIP_TEST_DATA_URI"]


# Best Parameters by Hyper

min_samples_leaf=int(float(os.environ["min_samples_leaf"]))
max_leaves=int(float(os.environ["max_leaves"]))
print("2.1 Reading Data")
# Download training data from Vertex AI DataSet
df=pd.read_csv(training_data_uri)
test_df=pd.read_csv(test_data_uri)
print("3 : Downloaded Training Data")

# Data Pre-Processing
df=df.drop(['location_source','location_destination','entity_type_graph','timestamp'], axis=1)
test_df=test_df.drop(['location_source','location_destination','entity_type_graph','timestamp'], axis=1)

# Trinaing Data
labels = df.pop("link_predict").tolist()
data = df.values.tolist()

# Test Data
test_labels = test_df.pop("link_predict").tolist()
test_data = test_df.values.tolist()
print("4 : Training ML Model")
# Training ML Model
ebm = ExplainableBoostingClassifier(random_state=SEED,min_samples_leaf=min_samples_leaf,max_leaves=max_leaves)
ebm.fit(data, labels)

print("5 : Trained ML Model")
test_predict = ebm.predict(test_data)

cm = np.array(confusion_matrix(test_labels, test_predict))
confusion = pd.DataFrame(cm, index=['LINK_PREDICTED_YES', 'LINK_PREDICTED_NO'], columns=['LINK_PREDICTED_YES', 'LINK_PREDICTED_NO'])

print(str(classification_report(test_labels, test_predict)))
print("6: Saving ML Model")

# Save the model to a local file
dump(ebm, model_name)
print("6: Uploading ML Model to GCS")

# Upload the saved model file to GCS
client = storage.Client()
bucket = client.get_bucket(bucket_name)
storage_path = os.path.join(model_validation_root_path_temp, model_name)
blob = bucket.blob(storage_path)
blob.upload_from_filename(model_name)
print("7: Uploaded ML Model to GCS")

print("Training is complete!")
