#!/usr/bin/env python
# Copyright 2021 Google Inc.
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
"""
This file is used to maintain mapping of different node groups.
"""

FIND = {
    "us-central1-a": "europe-west3-c",
    "europe-west3-c": "us-central1-b",
    "europe-west3-b": "us-central1-c",
    "us-central1-b": "europe-west3-a",
    "us-west1-b": "us-west1-c",
    "us-west1-c": "us-west1-c"
}
