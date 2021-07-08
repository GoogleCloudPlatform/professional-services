# Copyright 2019 Google LLC
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


from bqtag.bqtag import BQTableView

if __name__ == "__main__":

    """
    - DataCatalog Taxonomy should be present and have relevant policy tags: low. medium and high.
    - Update the BQ_PROJECT, CATALOG_PROJECT and TAXONOMY_DISPLAY_NAME with relevant values.
    - Key file used is credentials.json. Please add the correct path or copy credentials.json to the example folder. 
    - SA chould have relevant permissions to read Data Catalog Tags otherwise table creation will result in error.
    - BQ Dataset should be created and value provided in the BQ_DATASET
    """

    BQ_PROJECT = "<bq-project>"
    CATALOG_PROJECT = "<catalog-project>"
    TAXONOMY_DISPLAY_NAME = "<taxonomy_name>"
    BQ_DATASET = "<dataset>"

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
    bq = BQTableView(bq_dataset = BQ_DATASET,
                     catalog_taxonomy = TAXONOMY_DISPLAY_NAME,
                     location = LOCATION,
                     bq_project = BQ_PROJECT,
                     catalog_project = CATALOG_PROJECT,
                     json_credentials_path = JSON_CREDENTIALS_FILE)

    # Fetch Policy Tags from Data Catalog
    status = bq.fetch_policy_tags()

    # If Tags were fetched, create Table and View
    if status:
        bq.create_table(TABLE_TO_CREATE, TABLE_SCHEMA, TAG_MAP)
        bq.create_view(TABLE_TO_CREATE, VIEW1, VIEW1_TAGS)
        bq.create_view(TABLE_TO_CREATE, VIEW2, VIEW2_TAGS)


