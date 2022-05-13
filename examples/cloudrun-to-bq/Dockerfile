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

# Use the official lightweight Python image.
# https://hub.docker.com/_/python
FROM python:3.10-slim
ENV PYTHONUNBUFFERED True
ENV SERVING_PORT 8080

# Copy local code to the container image.
ENV APP_HOME /app
WORKDIR $APP_HOME
COPY . ./

RUN pip install --no-cache-dir -r requirements.txt
CMD exec gunicorn --bind :$SERVING_PORT --workers 1 --threads 8 --timeout 0 main:app
