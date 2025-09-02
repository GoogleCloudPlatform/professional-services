# Copyright 2025 Google LLC
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

FROM gcr.io/dataflow-templates-base/python3-template-launcher-base:PY311-2024-12-01

ENV FLEX_TEMPLATE_PYTHON_PY_FILE=/app/main.py
ENV FLEX_TEMPLATE_PYTHON_REQUIREMENTS_FILE=/app/requirements.txt

WORKDIR /app
COPY . /app

RUN pip install --no-cache-dir -r /app/requirements.txt

ENTRYPOINT ["/opt/google/dataflow/python_template_launcher"]
