# Copyright 2022 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
FROM python:3.9-slim

RUN mkdir /validator
COPY requirements.txt /validator/requirements.txt
RUN pip install -r /validator/requirements.txt
COPY validator.py /validator/validator.py

RUN mkdir /schemas
COPY firewallSchema.yaml /schemas/firewallSchema.yaml
COPY firewallSchemaAutoApprove.yaml /schemas/firewallAutoApprove.yaml
COPY firewallSchemaSettings.yaml /schemas/firewallSchemaSettings.yaml

RUN mkdir /rules

CMD ["/rules/**/*.yaml"]
ENTRYPOINT ["python3", "/validator/validator.py"]