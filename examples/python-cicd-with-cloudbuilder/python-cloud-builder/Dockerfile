#  Copyright 2019 Google LLC
#
#  Licensed under the Apache License, Version 2.0 (the "License");
#  you may not use this file except in compliance with the License.
#  You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
#  Unless required by applicable law or agreed to in writing, software
#  distributed under the License is distributed on an "AS IS" BASIS,
#  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#  See the License for the specific language governing permissions and
#  limitations under the License.

# This Dockerfile is used to build a custom cloud builder, shown in step 3 of README.md.
# It pulls the public Python 3 image from Dockerhub (https://hub.docker.com/_/python)and then installs virtualenv so
# that a virtual environment can be used to carry build steps forward.

FROM python:3

RUN pip install virtualenv