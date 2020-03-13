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

import json
import os

from bq_benchmarks.generic_benchmark_tools import schema_creator


class TestSchemaCreator(object):
    """Tests functionality of load_benchmark_tools.schema_creator.SchemaCreator.

    Attributes:
        test_schemas_dir(str): Directory where test json schemas should be
            written to.
        test_file_parameters(dict): Dictionary containing each test file
            parameter and its possible values.
    """

    def setup(self):
        """Sets up resources for tests.
        """
        abs_path = os.path.abspath(os.path.dirname(__file__))
        self.test_schemas_dir = os.path.join(abs_path, 'test_schemas')

        self.test_file_parameters = {
            'fileType': ['csv', 'json'],
            'fileCompressionTypes': {
                'csv': ['none'],
                'json': ['none']
            },
            'numColumns': [4],
            'numFiles': [1, 100, 1000, 10000],
            'targetDataSizes': [.01],
            'stagingDataSizes': ['10MB'],
            'columnTypes': [
                '100_STRING',
                '50_STRING_50_NUMERIC',
            ],
        }
        self.expected_schema_path_1 = os.path.join(
            abs_path, 'test_schemas/100_STRING_4.json')

        self.expected_schema_path_2 = os.path.join(
            abs_path, 'test_schemas/50_STRING_50_NUMERIC_4.json')

    def test_create_schmeas(self):
        """Tests SchemaCreator.create_schemas().

        Tests SchemaCreator's ability to create json schemas for benchmark
            tables based off of parameters in a file_params dict.

        Returns:
            True if test passes, else False.
        """
        test_schema_creator = schema_creator.SchemaCreator(
            schemas_dir=self.test_schemas_dir,
            file_params=self.test_file_parameters)

        test_schema_creator.create_schemas()

        assert os.path.isfile(self.expected_schema_path_1)
        assert os.path.isfile(self.expected_schema_path_2)

        expected_schema_1 = {
            "fields": [{
                "type": "STRING",
                "name": "string1",
                "mode": "REQUIRED"
            }, {
                "type": "STRING",
                "name": "string2",
                "mode": "REQUIRED"
            }, {
                "type": "STRING",
                "name": "string3",
                "mode": "REQUIRED"
            }, {
                "type": "STRING",
                "name": "string4",
                "mode": "REQUIRED"
            }]
        }

        expected_schema_2 = {
            "fields": [{
                "type": "STRING",
                "name": "string1",
                "mode": "REQUIRED"
            }, {
                "type": "STRING",
                "name": "string2",
                "mode": "REQUIRED"
            }, {
                "type": "NUMERIC",
                "name": "numeric1",
                "mode": "REQUIRED"
            }, {
                "type": "NUMERIC",
                "name": "numeric2",
                "mode": "REQUIRED"
            }]
        }

        with open(self.expected_schema_path_1) as json_file_1:
            json_str_1 = json_file_1.read()
            json_schema_1 = json.loads(json_str_1)
            assert expected_schema_1 == json_schema_1

        with open(self.expected_schema_path_2) as json_file_2:
            json_str_2 = json_file_2.read()
            json_schema_2 = json.loads(json_str_2)
            assert expected_schema_2 == json_schema_2

    def teardown(self):
        """Tears down resources created in setup().
        """
        os.remove(self.expected_schema_path_1)
        os.remove(self.expected_schema_path_2)
