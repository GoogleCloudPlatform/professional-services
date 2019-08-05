#!/usr/bin/env python

# Copyright 2019 Google LLC
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

PROJECT_ID = "pdf-processing-219114"
DATASET_ID = "patent_demo_data_pdp"
INPUT_BUCKET = "patent_demo_data_pdp"
OUTPUT_BUCKET = PROJECT_ID + "-vcm"
TEMP_DIRECTORY = "~/tmp/google/"

REGION = "us-central1"

OBJ_DET = "object_detection"
IMG_CLASS = "image_classification"
TEXT_CLASS = "text_classification"
ENT_REC = "entity_recognition"
