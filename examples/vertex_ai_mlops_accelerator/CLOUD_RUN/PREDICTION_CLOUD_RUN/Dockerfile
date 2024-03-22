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

FROM python:3.9-slim

RUN pip install Flask gunicorn google-cloud-bigquery redis jinja2 google-cloud-storage kfp google-cloud-aiplatform google-cloud-pipeline-components db-dtypes

ENV APP_HOME /app

WORKDIR $APP_HOME

COPY main.py ./main.py

COPY config.ini ./config.ini

CMD exec gunicorn --bind :$PORT main:app