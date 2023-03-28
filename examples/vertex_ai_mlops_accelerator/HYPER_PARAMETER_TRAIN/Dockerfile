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

FROM us-docker.pkg.dev/vertex-ai/prediction/sklearn-cpu.0-23:latest
#FROM python:3.9-slim

WORKDIR /root

# Installs hypertune library
RUN pip install cloudml-hypertune

# Installs additional packages
RUN python3 -m pip --trusted-host=pypi.python.org --trusted-host=pypi.org --trusted-host=files.pythonhosted.org install gcsfs fsspec interpret scikit-learn google-cloud-bigquery db-dtypes google-cloud-storage

RUN python3 -m pip --trusted-host=pypi.python.org --trusted-host=pypi.org --trusted-host=files.pythonhosted.org install --upgrade pandas

# Copies the trainer code to the docker image.
COPY hyper_parameter_task.py /root/hyper_parameter_task.py

# Sets up the entry point to invoke the trainer.
ENTRYPOINT ["python3","hyper_parameter_task.py"]