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

# Specifies base image and tag
FROM us-docker.pkg.dev/vertex-ai/prediction/sklearn-cpu.0-23:latest

WORKDIR /root

RUN python3 -m pip --trusted-host=pypi.python.org --trusted-host=pypi.org --trusted-host=files.pythonhosted.org install gcsfs fsspec google-cloud-storage interpret waitress numpy scikit-learn flask gunicorn pandas fastapi flask_cors

COPY config.ini /root/config.ini

COPY model.joblib /root/model.joblib

# Copies the trainer code to the docker image.
COPY prediction_server_beta.py /root/prediction_server_beta.py