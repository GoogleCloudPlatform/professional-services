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

FROM python:3.7-buster

# Copy files from official SDK image, including script/dependencies.
COPY --from=apache/beam_python3.7_sdk:latest /opt/apache/beam /opt/apache/beam

RUN python3 -m pip install --upgrade pip

# Installs additional packages
RUN python3 -m pip --trusted-host=pypi.python.org --trusted-host=pypi.org --trusted-host=files.pythonhosted.org install apache-beam==2.41.0 tensorflow_data_validation==1.11.0 google-cloud-aiplatform==1.19.0 pandas numpy redis

# Copies the trainer code to the docker image.
COPY data_prep /data_prep

# Set the entrypoint to Apache Beam SDK launcher.
ENTRYPOINT ["/opt/apache/beam/boot"]