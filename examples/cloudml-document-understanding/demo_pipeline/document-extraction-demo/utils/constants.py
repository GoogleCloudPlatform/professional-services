#!/usr/bin/python2
# Copyright 2018 Google Inc. All Rights Reserved.
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
"""Constants shared by the library."""


VALUE_NULL = 'None' # What to show in BigQuery when AutoML NER does not find the field in a doc.
FILENAME = 'file_name' # Name of the field in BigQuery for filename, must match the name in truth csv.

TABLE_DOCUMENT_CLASSIFICATION ='document_classification'
TABLE_NER_RESULTS = 'ner_results'
TABLE_OBJ_DETECT = 'object_detection'
TABLE_FINAL_VIEW = 'all_extracted_info'
TABLE_DOCUMENT_SUBJECT = 'document_subject'
