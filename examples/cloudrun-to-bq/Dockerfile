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

FROM python:3.10-slim as pythonBuilder
WORKDIR /app
COPY . ./
RUN pip3 install --target=/app/dependencies -r requirements.txt

FROM python:3.10-slim
ENV SERVING_PORT 8080
WORKDIR /app
COPY --from=pythonBuilder       /app .
ENV PYTHONPATH="${PYTHONPATH}:/app/dependencies"
ENV PATH="${PATH}:/app/dependencies/bin"
CMD exec gunicorn --bind :$SERVING_PORT --workers 1 --threads 8 --timeout 0 main:app
