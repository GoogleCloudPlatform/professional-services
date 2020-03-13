# Copyright 2019 Google LLC
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

from google.cloud import bigquery


class UserSchema(object):
    """Util class for working with user table schemas.

    Attributes:
        schema_path(str): Path to the user tables JOSN schema.
    """

    def __init__(self, schema_path):
        self.schema_path = schema_path

    def translate_json_schema(self):
        """Translates a schema in json format into BigQuery format.

        Returns:
            A BigQuery schema in List[google.cloud.bigquery.schema.SchemaField]
            format.
        """

        def _process_field(field):
            fields = ()
            if field['type'] == 'RECORD':

                fields = tuple([
                    _process_field(sub_field) for sub_field in field['fields']
                ])

            return bigquery.SchemaField(name=field['name'],
                                        field_type=field['type'],
                                        mode=field['mode'],
                                        fields=fields)

        filename = self.schema_path
        with open(filename, 'r') as f:
            json_schema = json.loads(f.read())

        return list(map(_process_field, json_schema['fields']))
