#!/usr/bin/bash

# Copyright 2019 Google LLC
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

# This script formats the various files in this repository based on Google open source
# style guidelines. This script is automatically called when running
# "make fmt" at the root of the repository.
#
# NOTE: The files will be formatted in place.
#
# The following languages are currently supported:
# - python (using yapf)

# format all python files in place
yapf -i -r --style google tools/**/*.py