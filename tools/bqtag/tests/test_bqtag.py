# Copyright 2021 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#         http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""
- Update the BQ_PROJECT, CATALOG_PROJECT, BQ_DATASET, LOCATION and TAXONOMY_DISPLAY_NAME with relevant values.
- Key file used is credentials.json. Please add the correct path or copy credentials.json to the tests folder. 
- SA should have relevant permissions to read Data Catalog Tags otherwise table creation will result in error.
"""

import unittest
import json
from bqtag import BQTableView

BQ_PROJECT = None  # Update this with BQ Project Value
CATALOG_PROJECT = None  # Update this with Data Catalog Project Value
TAXONOMY_DISPLAY_NAME = "test_taxonomy"  # Update this with Taxonomy Name
BQ_DATASET = "test_dataset"  # Update this with BQ Dataset
LOCATION = "US"
JSON_CREDENTIALS_FILE = "credentials.json"


class TestQueryParameters(unittest.TestCase):
    def test_1_policy_tag_creation(self):
        """
        Test if policy tags and taxonomies can be created.
        """
        bq = BQTableView(
            bq_dataset=BQ_DATASET,
            catalog_taxonomy=TAXONOMY_DISPLAY_NAME,
            location=LOCATION,
            bq_project=BQ_PROJECT,
            catalog_project=CATALOG_PROJECT,
            json_credentials_path=JSON_CREDENTIALS_FILE,
        )

        # Check if policy tags are downloaded
        self.assertTrue(
            bq.create_taxonomy(
                tags=[
                    {"name": "low", "description": "Low tag"},
                    {"name": "medium", "description": "Medium tag"},
                    {"name": "high", "description": "High tag"},
                ]
            )
        )

    def test_2_policy_tag_download(self):
        """
        Test if policy tags can be downloaded.
        """
        bq = BQTableView(
            bq_dataset=BQ_DATASET,
            catalog_taxonomy=TAXONOMY_DISPLAY_NAME,
            location=LOCATION,
            bq_project=BQ_PROJECT,
            catalog_project=CATALOG_PROJECT,
            json_credentials_path=JSON_CREDENTIALS_FILE,
        )

        # Check if policy tags are downloaded
        self.assertTrue(bq.fetch_policy_tags())

    def test_3_table_creation(self):
        """
        Test table creation and Correct Tag Association.
        """
        TABLE_TO_CREATE = "test_table"
        TABLE_SCHEMA = """[
                        {
                          "mode": "REQUIRED",
                          "name": "column1",
                          "type": "STRING"
                        },
                        {
                          "mode": "REQUIRED",
                          "name": "column2",
                          "type": "STRING"
                        },
                        {
                          "fields": [
                            {
                              "mode": "NULLABLE",
                              "name": "nested1",
                              "type": "STRING"
                            },
                            {
                              "mode": "NULLABLE",
                              "name": "nested2",
                              "type": "STRING"
                            }
                          ],
                          "mode": "NULLABLE",
                          "name": "parent",
                          "type": "RECORD"
                        }
                      ]"""

        TAG_MAP = dict()
        TAG_MAP["default_column_tag"] = "low"
        TAG_MAP["column2"] = "medium"
        TAG_MAP["parent.nested1"] = "high"

        bq = BQTableView(
            bq_dataset=BQ_DATASET,
            catalog_taxonomy=TAXONOMY_DISPLAY_NAME,
            location=LOCATION,
            bq_project=BQ_PROJECT,
            catalog_project=CATALOG_PROJECT,
            json_credentials_path=JSON_CREDENTIALS_FILE,
        )

        bq.fetch_policy_tags()

        # Create Dataset
        bq.create_dataset()

        created_schema = json.loads(
            bq.create_table(TABLE_TO_CREATE, TABLE_SCHEMA, TAG_MAP)
        )

        # Check if table was created
        self.assertTrue(created_schema != {})

        check = True
        for column in created_schema:

            if column["name"] == "column1":
                if column["policyTags"]["names"][0] != bq.policy_tags["low"]:
                    check = False
                    continue

            if column["name"] == "column2":
                if column["policyTags"]["names"][0] != bq.policy_tags["medium"]:
                    check = False
                    continue

            if column["name"] == "parent":
                for nested_column in column["fields"]:
                    if nested_column["name"] == "nested1":
                        if (
                            nested_column["policyTags"]["names"][0]
                            != bq.policy_tags["high"]
                        ):
                            check = False
                            continue

                    if nested_column["name"] == "nested2":
                        if (
                            nested_column["policyTags"]["names"][0]
                            != bq.policy_tags["low"]
                        ):
                            check = False
                            continue

        if len(created_schema) != 3:
            check = False

        # Check if tags are correct
        self.assertTrue(check)

    def test_4_view_creation(self):
        """
        Test view creation.
        """
        bq = BQTableView(
            bq_dataset=BQ_DATASET,
            catalog_taxonomy=TAXONOMY_DISPLAY_NAME,
            location=LOCATION,
            bq_project=BQ_PROJECT,
            catalog_project=CATALOG_PROJECT,
            json_credentials_path=JSON_CREDENTIALS_FILE,
        )

        bq.fetch_policy_tags()

        SOURCE_TABLE = "test_table"
        VIEW1 = "test_view_medium"
        VIEW1_TAGS = ["medium", "low"]

        query = bq.create_view(SOURCE_TABLE, VIEW1, VIEW1_TAGS)

        self.assertTrue(
            query.strip()
            == "SELECT column2, column1, STRUCT(parent.nested2)  as parent FROM `{project}.{dataset}.{table}`".format(
                project=bq.bq_project, dataset=bq.dataset, table=SOURCE_TABLE
            )
        )


if __name__ == "__main__":
    unittest.main()
