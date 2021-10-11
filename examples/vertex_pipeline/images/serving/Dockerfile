# Copyright 2021 Google LLC. All Rights Reserved.
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

FROM python:3.7-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
	wget patch libgomp1 \
	&& rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN python3 -m pip install -r \
    requirements.txt --quiet --no-cache-dir \
    && rm -f requirements.txt

# Copy the flask application
WORKDIR /root
COPY app.py /root

# Sets up the entry point to invoke the serving app.
ENTRYPOINT ["python", "app.py"]