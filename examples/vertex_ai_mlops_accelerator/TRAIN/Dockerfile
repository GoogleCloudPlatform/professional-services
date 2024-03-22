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
FROM us-docker.pkg.dev/vertex-ai/training/scikit-learn-cpu.0-23:latest

WORKDIR /root

RUN python3 -m pip install --upgrade pip

# Installs additional packages
RUN python3 -m pip --trusted-host=pypi.python.org --trusted-host=pypi.org --trusted-host=files.pythonhosted.org install interpret gcsfs fsspec scikit-learn google-cloud-bigquery db-dtypes google-cloud-storage

# Copies the trainer code to the docker image.
COPY train.py /root/train.py

COPY config.ini /root/config.ini

RUN python3 -m pip --trusted-host=pypi.python.org --trusted-host=pypi.org --trusted-host=files.pythonhosted.org install --upgrade pandas

# Sets up the entry point to invoke the trainer.
#ENTRYPOINT ["python3", "train.py"]