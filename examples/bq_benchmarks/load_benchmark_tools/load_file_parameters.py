"""
load_file_parameters.py holds a dict called FILE_PARAMETERS that holds the
paramters used to create combinations of files. If different parameters are
to be used to create combinations, the FILE_PARAMETERS dict should be
modified.
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

FILE_PARAMETERS = {
    'fileType': ['avro', 'json', 'csv', 'parquet'],
    'fileCompressionTypes': {
        'avro': ['none', 'snappy'],
        'csv': ['none', 'gzip'],
        'json': ['none', 'gzip'],
        'parquet': ['none'],
    },
    'numColumns': [10, 100, 1000],
    'numFiles': [1, 100, 1000, 10000],
    'targetDataSizes': [.01, .1, 1, 2],
    'stagingDataSizes': ['10MB', '107MB', '1073MB', '2147MB'],
    'columnTypes': [
        '100_STRING',
        '50_STRING_50_NUMERIC',
        '10_STRING_90_NUMERIC',
    ],
}
