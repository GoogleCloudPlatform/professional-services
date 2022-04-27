"""
 !/usr/bin/env python
 -*- coding: utf-8 -*-

 Copyright 2021 Google LLC

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

         http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
"""

import logging
import sys
import json
import copy
import traceback
import io

from google.cloud import bigquery, datacatalog_v1
from google.api_core.exceptions import MethodNotImplemented, NotFound
import google.auth

__all__ = ["BQTableView"]

#############################################################################
# Create Logger
#############################################################################

FORMAT = "%(asctime)-15s %(levelname)s %(message)s"


def get_logger(name, fmt):
    """
    Creates a Logger that logs to stdout
    :param name: name of the logger
    :param fmt: format string for log messages
    :return: Logger
    """
    handler = logging.StreamHandler(sys.stdout)
    handler.setLevel(logging.DEBUG)
    handler.setFormatter(logging.Formatter(fmt))
    log = logging.getLogger(name)
    log.setLevel(logging.DEBUG)
    log.addHandler(handler)
    return log


LOGGER = get_logger("bqtag", FORMAT)


#############################################################################
# Classes to create tree structure to create SQL query for nested columns
#############################################################################


class ColumnNode:
    """
    Class to represent a BQ column in a tree
    """

    def __init__(self, name="", parent="", column_json=None, children=None):
        self.name = name
        self.json = column_json
        self.children = children
        self.parent = parent
        self.mode = ""


class ColumnTree:
    """
    Class to represent a tree of columns for a BQ table
    """

    def __init__(self):
        self.root = ColumnNode(
            name="Root", column_json=copy.copy({}), children=copy.copy({})
        )

    def add_node(self, node_json: dict()):

        cur_node = self.root

        path = node_json["name"].split(".")
        parents = path[:-1]
        node_name = path[-1]

        for parent in parents:

            if parent in cur_node.children:
                cur_node = cur_node.children[parent]
            else:
                new_node = ColumnNode(
                    name=parent,
                    parent=cur_node.name,
                    column_json=copy.copy({}),
                    children=copy.copy({}),
                )

                cur_node.children[parent] = new_node
                cur_node = new_node

        if node_name in cur_node.children:
            cur_node.children[node_name].json = node_json
            cur_node.mode = node_json["parent_mode"]
        else:
            cur_node.children[node_name] = ColumnNode(
                name=node_name,
                parent=cur_node.name,
                column_json=copy.copy(node_json),
                children=copy.copy({}),
            )
            cur_node.mode = node_json["parent_mode"]

    def generate_query(self):
        """
        Main function to generate SQL query for columns stored in tree.
        """
        return_str = ""
        start = self.root

        if start.children:
            return_lst = self._rec_generate_query(start.children, "")
            return_str = ", ".join(return_lst)

        return return_str

    def _rec_generate_query(self, children, parent_name):
        """
        Recursive function to generate SQL query for columns stored in tree.
        """
        db = []

        for _, child in children.items():

            if len(child.children) == 0:
                if parent_name == "":
                    db.append(child.name)
                else:
                    db.append(parent_name + "." + child.name)
            else:
                if child.mode == "REPEATED":
                    if parent_name == "":
                        db.append(
                            "Array(SELECT AS VALUE STRUCT("
                            + ", ".join(
                                self._rec_generate_query(
                                    children=child.children, parent_name=child.name
                                )
                            )
                            + ") FROM UNNEST("
                            + child.name
                            + ") as "
                            + child.name
                            + ")  as "
                            + child.name
                        )
                    else:
                        db.append(
                            "Array(SELECT AS VALUE STRUCT("
                            + ", ".join(
                                self._rec_generate_query(
                                    children=child.children, parent_name=child.name
                                )
                            )
                            + ") FROM UNNEST("
                            + parent_name
                            + "."
                            + child.name
                            + ") as "
                            + child.name
                            + ")  as "
                            + child.name
                        )
                else:
                    if parent_name == "":
                        db.append(
                            "STRUCT("
                            + ", ".join(
                                self._rec_generate_query(
                                    children=child.children, parent_name=child.name
                                )
                            )
                            + ")  as "
                            + child.name
                        )
                    else:
                        db.append(
                            "STRUCT("
                            + ", ".join(
                                self._rec_generate_query(
                                    children=child.children,
                                    parent_name=parent_name + "." + child.name,
                                )
                            )
                            + ")  as "
                            + child.name
                        )

        return db


###########################################################################
# Main class to update tags and create views
###########################################################################
class BQTableView:
    """
    Class to create tagged BQ Tables and Views.
    """

    # Constructor
    def __init__(
        self,
        bq_dataset: str,
        catalog_taxonomy: str,
        location: str = "US",
        bq_project: str = None,
        catalog_project: str = None,
        json_credentials_path: str = None,
    ) -> None:

        self.dataset = bq_dataset
        self.taxonomy = catalog_taxonomy
        self.taxonomy_id = None
        self.policy_tags = dict()
        self.policy_tags_rev = dict()
        self.location = location
        self.bq_project = bq_project
        self.catalog_project = catalog_project
        self.json_credentials_path = json_credentials_path

        self.bq = None
        self.dc = None

        self._get_bq_client()
        self._get_catalog_client()

    # Intialize BQ Client
    def _get_bq_client(self) -> None:
        """
        Initializes bigquery.Client object
        :return: None
        """
        if self.json_credentials_path:
            self.bq = bigquery.Client.from_service_account_json(
                self.json_credentials_path
            )
            if self.bq_project:
                self.bq.project = self.bq_project
            else:
                self.bq_project = self.bq.project
            if self.location:
                self.bq._location = self.location
        else:
            if self.bq_project and self.location:
                self.bq = bigquery.Client(
                    project=self.bq_project, location=self.location
                )
            else:
                self.bq = bigquery.Client()
                if not self.bq_project:
                    self.bq_project = self.bq.project

        LOGGER.debug("BQ Client Initialised.")

    # Intialize Catalog Client
    def _get_catalog_client(self) -> None:
        """
        Initializes datacatalog.PolicyTagManagerClient object
        :return: None
        """
        if self.json_credentials_path:
            self.dc = datacatalog_v1.PolicyTagManagerClient.from_service_account_json(
                self.json_credentials_path
            )
            if not self.catalog_project:
                _, project_id = google.auth.default()
                self.catalog_project = project_id
        else:
            self.dc = datacatalog_v1.PolicyTagManagerClient()
            if not self.catalog_project:
                _, project_id = google.auth.default()
                self.catalog_project = project_id

        LOGGER.debug("Data Catalog Client Initialised.")

    # Create Taxonomy and Tags
    def create_taxonomy(self, tags: list) -> bool:
        """
        Create Taxonomy and Policy Tags

        :params tags: List of Tags to be created. Each tag is
                      represented as dictionary -
                      {
                        "name": "Name of Tag",
                        "description": "Description of Tag",
                        "parent_policy_tag": "Parent Policy
                                              Tag for nested
                                              policy tags"
                      }
        :return: True if success and False if Failure
        """
        try:
            taxonomy = datacatalog_v1.types.Taxonomy()
            taxonomy.display_name = self.taxonomy
            created_taxonomy = self.dc.create_taxonomy(
                parent="projects/{p}/locations/{l}".format(
                    p=self.catalog_project, l=self.location.lower()
                ),
                taxonomy=taxonomy,
            )
        except (MethodNotImplemented, NotFound) as e:
            LOGGER.error(
                "Could not create Taxonomy. \
                            API call to Google failed. Error received: %s",
                str(e),
            )
            LOGGER.error(traceback.format_exc())
            return False

        LOGGER.info("Taxonomy Created Successfully.")

        try:
            for tag in tags:
                policy_tag = datacatalog_v1.types.PolicyTag()
                policy_tag.display_name = tag["name"]
                policy_tag.description = tag.get("description", "")
                policy_tag.parent_policy_tag = tag.get("parent_policy_tag", "")
                self.dc.create_policy_tag(
                    parent=created_taxonomy.name, policy_tag=policy_tag
                )
        except (MethodNotImplemented, NotFound) as e:
            LOGGER.error(
                "Could not create Taxonomy. \
                            API call to Google failed. Error received: %s",
                str(e),
            )
            LOGGER.error(traceback.format_exc())
            return False

        LOGGER.info("%s Tags Created Successfully.", str(len(tags)))

        return True

    # Download policy tags from Data Catalog Taxonomy and save them
    # in self.policy_tags
    def fetch_policy_tags(self) -> bool:
        """
        Download policy tags from Taxonomy
        :return: True if success and False if Failure
        """
        LOGGER.debug("Determining Taxonomy ID using Taxonomy Name provided.")

        try:
            taxonomies = self.dc.list_taxonomies(
                parent="projects/{p}/locations/{l}".format(
                    p=self.catalog_project, l=self.location.lower()
                )
            )
        except (MethodNotImplemented, NotFound) as e:
            LOGGER.error(
                "Could not fetch Policy Tags. \
                            API call to Google failed. Error received: %s",
                str(e),
            )
            LOGGER.error(traceback.format_exc())
            return False

        for taxonomy in taxonomies:
            if taxonomy.display_name == self.taxonomy:
                self.taxonomy_id = taxonomy.name
                break

        if not self.taxonomy_id:
            LOGGER.error(
                "Could not determine Taxonomy ID for taxonomy: %s. \
                            Please check if Taxonomy name, Data Catalog Project \
                            and Location are correct.",
                self.taxonomy,
            )
            return False

        LOGGER.debug("Downloading Policy Tags from Taxonomy.")

        policy_tags = self.dc.list_policy_tags(parent=self.taxonomy_id)

        for policy_tag in policy_tags:
            self.policy_tags[policy_tag.display_name] = policy_tag.name

        self.policy_tags_rev = {k: v for v, k in self.policy_tags.items()}

        LOGGER.info(
            "Policy Tags downlaoded from Taxonomy. Total tags: %s",
            str(len(self.policy_tags)),
        )

        return True

    # create dataset
    def create_dataset(self) -> bool:
        """
        Create a new BQ Dataset.
        :return: True if success and False if Failure
        """
        dataset = bigquery.Dataset(".".join([self.bq_project, self.dataset]))
        dataset.location = self.location

        try:
            dataset = self.bq.create_dataset(dataset, timeout=30)
        except (MethodNotImplemented, NotFound) as e:
            LOGGER.error("Could not create dataset: %s", str(e))
            LOGGER.error(traceback.format_exc())
            return False

        LOGGER.info(
            "Dataset created successfully: %s.%s.", self.bq_project, self.dataset
        )
        return True

    # Create a table with tags
    def create_table(
        self, table_name: str, table_schema: str, table_tag_map: dict = None
    ) -> str:
        """
        Create a new Tagged table.
        :param table_name: Name of the table to create
        :param table_schema: Schema of the table to create
        :param table_tag_map: Mapping of Tags to Columns
        :return: json containing schema of table created
        """
        tagged_schema = self._process_schema(
            table_schema=table_schema, table_tag_map=table_tag_map
        )

        table = bigquery.Table(
            ".".join([self.bq_project, self.dataset, table_name]), schema=tagged_schema
        )

        try:
            table = self.bq.create_table(table)  # Make an API request.
        except (MethodNotImplemented, NotFound) as e:
            LOGGER.error("Could not create table: %s", str(e))
            LOGGER.error(traceback.format_exc())
            return "{}"

        LOGGER.info(
            "Table created successfully: %s.%s.%s.",
            self.bq_project,
            self.dataset,
            table_name,
        )
        # convert table schema to JSON for return
        f = io.StringIO("")
        self.bq.schema_to_json(table.schema, f)
        table_schema = f.getvalue()

        return table_schema

    # Create a view from tags
    def create_view(self, table_name: str, view_name: str, tags: list) -> str:
        """
        Create a new View with columns having specfied tags.
        :param table_name: Name of the source table
        :param view_name: Name of the View to create
        :param tags: List of tags to include in view
        :return: SQL query of the created view
        """
        LOGGER.debug("Start Downloading BQ Schema.")

        # Download Table Schema using API
        try:
            table = self.bq.get_table(
                ".".join([self.bq_project, self.dataset, table_name])
            )
        except (MethodNotImplemented, NotFound) as e:
            LOGGER.error("Could not download source table schema: %s", str(e))
            LOGGER.error(traceback.format_exc())
            return ""

        f = io.StringIO("")
        self.bq.schema_to_json(table.schema, f)
        table_schema = f.getvalue()

        LOGGER.info("Table schema downloaded. Started View Creation.")

        # Create a map of tags to columms
        tag_column_map = self._create_tag_column_map(schema=table_schema)

        # Find columns having tag in tags
        columns = []

        for tag in tags:
            if tag in tag_column_map:
                columns += tag_column_map[tag]

        # Create column tree and generate query for the view
        column_tree = ColumnTree()

        for column in columns:
            column_tree.add_node(column)

        query_columns = column_tree.generate_query()

        if query_columns.strip() == "":
            LOGGER.info("No Columns in Query. View not created.")
            return ""

        query = "SELECT {q} FROM `{p}.{d}.{t}`".format(
            q=query_columns, p=self.bq_project, d=self.dataset, t=table_name
        )

        LOGGER.debug("Query Created: %s", query)

        # create view
        job_config = bigquery.QueryJobConfig(
            destination=".".join([self.bq_project, self.dataset, view_name])
        )

        try:
            query_job = self.bq.query(query, job_config=job_config)
            query_job.result()  # Wait for the job to complete.
        except (MethodNotImplemented, NotFound) as e:
            LOGGER.error("Could not create view: %s", str(e))
            LOGGER.error(traceback.format_exc())
            return ""

        LOGGER.info(
            "Authorised view created: %s.%s.%s",
            self.bq_project,
            self.dataset,
            view_name,
        )

        return query

    # Internal Function to detemine the tagged schema
    def _process_schema(self, table_schema: str, table_tag_map: dict) -> None:
        """
        Process the untagged schema and convert it into tagged one by.
        adding tags to relevant columns using table_tag_map

        :param table_schema: Untagged schema of the table
        :param table_tag_map: Mapping of tags to columns
        :return: None
        """
        json_schema = json.loads(table_schema)

        # Check if rable_tag_map is empty
        if not table_tag_map:
            return json_schema

        default_column_tag = ""

        for tag_column, tag in table_tag_map.items():

            # If tag column is default_column_tag then skip the loop
            if tag_column == "default_column_tag":
                default_column_tag = tag
                continue

            tag_columns = tag_column.split(".")

            # If tag does not exist then continue
            if tag.lower() not in self.policy_tags:
                continue

            cur_level = json_schema
            cur_column = {}

            # Will remain true if all columns in column depth are found
            found_all = True

            column_number = 0

            # Loop over all the depths of column
            for tag_column2 in tag_columns:

                column_number += 1
                found = False

                # Loop over levels of schema to get to teight depth
                for column in cur_level:

                    if column["name"] == tag_column2:
                        found = True
                        if "fields" in column:
                            cur_level = column["fields"]
                        else:
                            if column_number != len(tag_columns):
                                found = False
                        cur_column = column
                        break

                if not found:
                    found_all = False
                    break

            if found_all:
                if cur_column["type"].upper() != "RECORD":
                    if "policyTags" not in cur_column:
                        cur_column["policyTags"] = {"names": []}
                    cur_column["policyTags"]["names"].append(
                        self.policy_tags[tag.lower()]
                    )

        # Add default column tag if present
        if default_column_tag.strip() != "":
            default_column_tag = default_column_tag.strip().lower()
            if default_column_tag in self.policy_tags:
                for column in json_schema:
                    self._process_default_tag(
                        column=column, tag=self.policy_tags[default_column_tag]
                    )

        return json_schema

    # Internal function to add the default tag to schema.
    def _process_default_tag(self, column: dict, tag: str) -> None:
        """
        Recursively tag all columns that do not have a tag

        :param column: column data
        :param tag: Default tag
        :return: None
        """
        if column["type"].upper() == "RECORD":
            for sub_column in column["fields"]:
                self._process_default_tag(column=sub_column, tag=tag)
        else:
            if "policyTags" not in column:
                column["policyTags"] = {"names": []}
                column["policyTags"]["names"].append(tag)

    # Read schema file and cereate policy-tag column map
    def _create_tag_column_map(self, schema: str) -> dict:
        """
        Read table schema and map columns to tags.

        :param schema: Schema of the table
        :return: Map of columns to tag
        """
        schema_json = json.loads(schema)

        tag_to_columns = dict()
        tag_to_columns_mapped = dict()

        # update tag_to_columns
        self._rec_create_tag_column_map(
            items=schema_json, tag_to_columns=tag_to_columns
        )

        # map tag_to_columns key to tag_map and populate tag
        for k, v in tag_to_columns.items():

            if k in self.policy_tags_rev:
                tag_to_columns_mapped[self.policy_tags_rev[k]] = copy.deepcopy(v)
            else:
                print("Policy Tag", k, "not found in map file.")

        return copy.deepcopy(tag_to_columns_mapped)

    def _rec_create_tag_column_map(
        self, items: list, tag_to_columns: dict, parent="", paren_mode=""
    ) -> None:
        """
        Recursive Function to map columns to tags.

        :param items: List of columns
        :param tag_to_columns: map of tag to columns
        :param parent: Parent column in case of nested column
        :param parent_mode: Mode of the parent column
        :return: None
        """
        for item in items:
            if str(item["type"]).upper() == "RECORD":
                if parent == "":
                    if "mode" in item:
                        if item["mode"].upper() == "REPEATED":
                            self._rec_create_tag_column_map(
                                items=item["fields"],
                                tag_to_columns=tag_to_columns,
                                parent=item["name"],
                                paren_mode="REPEATED",
                            )
                        else:
                            self._rec_create_tag_column_map(
                                items=item["fields"],
                                tag_to_columns=tag_to_columns,
                                parent=item["name"],
                            )
                    else:
                        self._rec_create_tag_column_map(
                            items=item["fields"],
                            tag_to_columns=tag_to_columns,
                            parent=item["name"],
                        )
                else:
                    if "mode" in item:
                        if item["mode"].upper() == "REPEATED":
                            self._rec_create_tag_column_map(
                                items=item["fields"],
                                tag_to_columns=tag_to_columns,
                                parent=parent + "." + item["name"],
                                paren_mode="REPEATED",
                            )
                        else:
                            self._rec_create_tag_column_map(
                                items=item["fields"],
                                tag_to_columns=tag_to_columns,
                                parent=parent + "." + item["name"],
                            )
                    else:
                        self._rec_create_tag_column_map(
                            items=item["fields"],
                            tag_to_columns=tag_to_columns,
                            parent=parent + "." + item["name"],
                        )
            else:
                if "policyTags" in item:
                    for tag in item["policyTags"]["names"]:

                        if tag not in tag_to_columns:
                            tag_to_columns[tag] = list()

                        tmp_item = copy.deepcopy(item)
                        tmp_item.pop("policyTags", None)

                        if parent != "":
                            tmp_item["name"] = parent + "." + tmp_item["name"]
                        tmp_item["parent"] = parent
                        tmp_item["parent_mode"] = paren_mode

                        tag_to_columns[tag].append(copy.deepcopy(tmp_item))
