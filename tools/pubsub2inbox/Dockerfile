# Copyright 2022 Google, LLC.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# Use the official lightweight Python image.
FROM python:3.10-slim

# Allow statements and log messages to immediately appear in the Knative logs
ENV PYTHONUNBUFFERED=True
ENV CONFIG=
ENV SERVICE_ACCOUNT=
ENV LOG_LEVEL=10
ENV WEBSERVER=1
ENV PORT=8080

ENV APP_HOME /app
WORKDIR $APP_HOME
COPY main.py requirements.txt ./
RUN mkdir {filters,output,processors,helpers}
COPY filters/*.py filters/
COPY output/*.py output/
COPY processors/*.py processors/
COPY helpers/*.py helpers/

# Install some support packages
RUN apt-get update && apt-get install -y libmagic1

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Run as a web service on using the gunicorn webserver, with one worker process and 8 threads.
#
# For environments with multiple CPU cores, increase the number of workers
# to be equal to the cores available.
#
# Timeout is set to 0 to disable the timeouts of the workers to allow Cloud Run to handle 
# instance scaling.
CMD exec gunicorn --bind :$PORT --workers 1 --threads 8 --timeout 0 main:app

