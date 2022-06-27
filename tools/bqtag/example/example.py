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


from bqtag import BQTableView

if __name__ == "__main__":
    """
    - Update the BQ_PROJECT, CATALOG_PROJECT, BQ_DATASET and TAXONOMY_DISPLAY_NAME with relevant values.
    - Key file used is credentials.json. Please add the correct path or copy credentials.json to the example folder.
    - SA should have relevant permissions to read Data Catalog Tags otherwise table creation will result in error.
    """

    BQ_PROJECT = None  # Update this with BQ Project Value
    CATALOG_PROJECT = None  # Update this with Data Catalog Project Value
    TAXONOMY_DISPLAY_NAME = "taxonomy_name"  # Update this with Taxonomy Name
    BQ_DATASET = "dataset_name"  # Update this with BQ Dataset
    LOCATION = "US"
    JSON_CREDENTIALS_FILE = "credentials.json"
    TABLE_TO_CREATE = "table1"
    TABLE_SCHEMA = """[
                        {
                          "description": "Customer ID",
                          "mode": "REQUIRED",
                          "name": "customer_id",
                          "type": "STRING"
                        },
                        {
                          "description": "Customer Name",
                          "mode": "REQUIRED",
                          "name": "customer_name",
                          "type": "STRING"
                        },
                        {
                          "description": "Email",
                          "mode": "REQUIRED",
                          "name": "email_address",
                          "type": "STRING"
                        },
                        {
                          "description": "Phone Number",
                          "mode": "NULLABLE",
                          "name": "phone",
                          "type": "STRING"
                        },
                        {
                          "fields": [
                            {
                              "mode": "NULLABLE",
                              "name": "street",
                              "type": "STRING"
                            },
                            {
                              "mode": "NULLABLE",
                              "name": "city",
                              "type": "STRING"
                            },
                            {
                              "mode": "NULLABLE",
                              "name": "state",
                              "type": "STRING"
                            },
                            {
                              "mode": "NULLABLE",
                              "name": "pincode",
                              "type": "STRING"
                            }
                          ],
                          "mode": "NULLABLE",
                          "name": "address",
                          "type": "RECORD"
                        }
                      ]"""

    TAG_MAP = dict()
    TAG_MAP["default_column_tag"] = "low"
    TAG_MAP["customer_name"] = "medium"
    TAG_MAP["email_address"] = "medium"
    TAG_MAP["phone"] = "high"
    TAG_MAP["address.street"] = "high"
    TAG_MAP["address.pincode"] = "medium"

    VIEW1 = "view_medium"
    VIEW1_TAGS = ["medium", "low"]
    VIEW2 = "view_high"
    VIEW2_TAGS = ["high", "medium", "low"]

    # Create BQTableView Object
    bq = BQTableView(
        bq_dataset=BQ_DATASET,
        catalog_taxonomy=TAXONOMY_DISPLAY_NAME,
        location=LOCATION,
        bq_project=BQ_PROJECT,
        catalog_project=CATALOG_PROJECT,
        json_credentials_path=JSON_CREDENTIALS_FILE,
    )

    # Create Taxonomy and Policy Tags
    bq.create_taxonomy(
        [
            {"name": "low", "description": "Low tag"},
            {"name": "medium", "description": "Medium tag"},
            {"name": "high", "description": "High tag"},
        ]
    )

    # Create Dataset
    bq.create_dataset()

    # Fetch Policy Tags from Data Catalog
    status = bq.fetch_policy_tags()

    # If Tags were fetched, create Table and View
    if status:
        bq.create_table(TABLE_TO_CREATE, TABLE_SCHEMA, TAG_MAP)
        bq.create_view(TABLE_TO_CREATE, VIEW1, VIEW1_TAGS)
        bq.create_view(TABLE_TO_CREATE, VIEW2, VIEW2_TAGS)
