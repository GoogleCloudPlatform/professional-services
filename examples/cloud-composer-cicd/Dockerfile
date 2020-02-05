# Copyright 2020 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,


FROM python:3.7

COPY requirements.txt ./
RUN pip3 install --no-cache-dir -r requirements.txt
ENV AIRFLOW_HOME=/workspace/airflow
ENV AIRFLOW__CORE__LOAD_EXAMPLES=False
