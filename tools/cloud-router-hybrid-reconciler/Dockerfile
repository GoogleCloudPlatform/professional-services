# Copyright 2026 Google LLC
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

FROM python:3.14-slim

WORKDIR /cloud-router-hybrid-reconciler

ENV RECONCILER_CONFIG=

COPY ./requirements.txt /cloud-router-hybrid-reconciler/requirements.txt
RUN pip install --no-cache-dir --upgrade -r /cloud-router-hybrid-reconciler/requirements.txt
COPY ./main.py /cloud-router-hybrid-reconciler/main.py

CMD ["python3", "/cloud-router-hybrid-reconciler/main.py"]