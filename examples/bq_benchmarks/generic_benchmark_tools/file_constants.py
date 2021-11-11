"""
file_constants.py holds a dict called FILE_CONSTANTS that holds information
for types of files involved in the benchmark process.
"""

# Copyright 2018 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

from google.cloud import bigquery

FILE_CONSTANTS = {
    'extractFormats': {
        'avro': bigquery.job.DestinationFormat.AVRO,
        'csv': bigquery.job.DestinationFormat.CSV,
        'json': bigquery.job.DestinationFormat.NEWLINE_DELIMITED_JSON,
    },
    'sourceFormats': {
        'avro': bigquery.SourceFormat.AVRO,
        'csv': bigquery.SourceFormat.CSV,
        'json': bigquery.SourceFormat.NEWLINE_DELIMITED_JSON,
        'orc': bigquery.SourceFormat.ORC,
        'parquet': bigquery.SourceFormat.PARQUET,
    },
    'compressionFormats': {
        'none': bigquery.job.Compression.NONE,
        'gzip': bigquery.job.Compression.GZIP,
        'snappy': bigquery.job.Compression.SNAPPY,
    },
    'compressionExtensions': {
        'snappy': 'snappy',
        'gzip': 'gz',
    },
}
