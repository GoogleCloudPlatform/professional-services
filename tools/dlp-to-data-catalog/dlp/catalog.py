# Copyright 2023 Google LLC. This software is provided as-is, without warranty
# or representation for any use or purpose. Your use of it is subject to your
# agreement with Google.
"""Creates and attaches a tag template to a BigQuery table."""

from typing import List, Dict, Optional
import re
import datetime
from google.cloud import datacatalog_v1


class Catalog:
    """Creates a Data Catalog Tag Template."""

    def __init__(
        self,
        data: List[Dict],
        project_id: str,
        zone: str,
        dataset: Optional[str] = None,
        table: Optional[str] = None,
        instance_id: Optional[str] = None,
        entry_group_name: Optional[str] = None,
    ):
        """Initializes the class with the required data.

        Args:
            data(str): The data Previously inspected by the DLP API.
            project(str): Project ID for which the client acts on behalf of.
            zone(str): The compute engine region.
            dataset(str): The BigQuery dataset to be scanned if it's BigQuery.
                        Optional. Default value is None.
            table(str): The name of the table if it's BigQuery.
                        Optional. Default value is None.
            instance(str): Name of the database instance if it's CloudSQL.
                           Optional. Default value is None.
        """
        self.client = datacatalog_v1.DataCatalogClient()
        self.tag_template = datacatalog_v1.TagTemplate()
        self.data = data
        self.project_id = project_id
        self.zone = zone
        self.dataset = dataset
        self.table = table
        self.instance_id = instance_id
        self.entry_group_name = entry_group_name

        timestamp = str(int(datetime.datetime.now().timestamp()))
        timestamp = timestamp[:8]
        if self.instance_id is not None:
            # REGEX to remove special characters from the instance_id.
            instance_id = re.sub(r"[^a-zA-Z0-9_]", "", instance_id)
            # Limits the instance_id to 50 characters.
            instance_id = instance_id[:50]
            self.entry_group_id = f"dlp_{instance_id}_{timestamp}"
            self.entry_id = f"dlp_{instance_id}_{self.table}_{timestamp}"
        else:
            self.tag_template_id = (
                f"dlp_{dataset.lower()}_{table.lower()}_{timestamp}"
            )

    def create_tag_template(self, parent: str) -> None:
        """Creates a tag template.

        Args:
            parent: The parent resource for the tag template.
        """
        # Create a new source field for each field in the data.
        fields = {}

        # Creates a unique display name for each tag template
        tag_template_name = (
            f"DLP_columns_{self.project_id}_{self.dataset}_{self.table}"
        )
        self.tag_template.display_name = tag_template_name

        # if the data is a list, it converts to a dict
        if isinstance(self.data, list):
            self.data = self.data[0]
        # Creates a dictionary with the fields of the Tag Templates
        fields = {}
        # Creates the fields of the Tag Template.
        for key, value in self.data.items():
            new_source_field = datacatalog_v1.TagTemplateField(
                name=key,
                type=datacatalog_v1.FieldType(
                    primitive_type=(
                        datacatalog_v1.FieldType.PrimitiveType.STRING
                    )
                ),
                description=value,
            )
            fields[new_source_field.name] = new_source_field
        self.tag_template.fields.update(fields)

        # Makes the request for the Tag Template creation.
        request = datacatalog_v1.CreateTagTemplateRequest(
            parent=parent,
            tag_template_id=self.tag_template_id,
            tag_template=self.tag_template,
        )

        try:
            self.tag_template = self.client.create_tag_template(request)
        except ValueError as error:
            print("""Error occured while creating
                        tag template:""", str(error))

    def attach_tag_to_table(self, table_entry: str) -> None:
        """Attaches a tag to a BigQuery or CloudSQL table.

        Args:
            table_entry: The table name for the tag to be attached.
        """
        # Attach a tag to the table.
        tag = datacatalog_v1.types.Tag(
            template=self.tag_template.name, name="DLP_Analysis"
        )
        for key, value in self.data.items():
            tag.fields[key] = datacatalog_v1.types.TagField(string_value=value)

        self.client.create_tag(parent=table_entry, tag=tag)

    def create_custom_entry_group(self) -> str:
        """Creates a new Custom entry group.

        Returns:
            str: The entry_group object name
        """
        entry_group_obj = datacatalog_v1.types.EntryGroup()
        entry_group_obj.display_name = f"Cloud SQL {self.instance_id}"

        try:
            entry_group = self.client.create_entry_group(
                parent=self.client.common_location_path(
                    self.project_id, self.zone
                ),
                entry_group_id=self.entry_group_id,
                entry_group=entry_group_obj,
            )
        except ValueError as error:
            print("""Error occured while creating
                        the entry group:""", str(error))
        return entry_group.name

    def create_entry(self, entry_group_name: str) -> None:
        """Creates one entry for each column in the CloudSQL inspected table.

        Saves the name of the column and the inspection InfoType as the
        description in a new entry that belongs to an entry group.

        Args:
        entry_group_name(str): The complete entry group resource name.
        """

        # Create an entry
        entry = datacatalog_v1.types.Entry()
        entry.user_specified_system = "Cloud_SQL"
        entry.user_specified_type = "SQL"
        entry.display_name = f"DLP_inspection_{self.instance_id}_{self.table}"
        entry.description = ""
        entry.linked_resource = (
            f"//sqladmin.googleapis.com/projects/{self.project_id}"
            f"/instances/{self.instance_id}"
        )

        entry.schema.columns = [
            datacatalog_v1.types.ColumnSchema(
                column=key,
                type_="STRING",
                description=value,
                mode=None,
            )
            for key, value in self.data.items()
        ]

        try:
            entry = self.client.create_entry(
                parent=entry_group_name, entry_id=self.entry_id, entry=entry
            )
        except ValueError as error:
            print("""Error occured while creating
                        the entry:""", str(error))

    def main(self) -> None:
        """Creates a tag template for BigQuery tables and creates custom
        entries for Cloud SQL."""
        parent = f"projects/{self.project_id}/locations/{self.zone}"

        nested_type = False
        if any('.' in key for key in self.data.keys()) is True:
            nested_type = True

        # Checks if it's BigQuery or CloudSQL.
        if self.instance_id is None:
            if nested_type is False:
                # Create the tag template.
                self.create_tag_template(parent)
            else:
                nested_data = (
                    [{key.replace(".", "_"): value for key,
                      value in self.data.items()}]
                )
                self.data = nested_data
                self.create_tag_template(parent)

            resource_name = (
                f"//bigquery.googleapis.com/projects/{self.project_id}"
                f"/datasets/{self.dataset}/tables/{self.table}"
            )

            # Creates the BigQuery table entry.
            table_entry = self.client.lookup_entry(
                request={"linked_resource": resource_name}
            )
            table_entry = table_entry.name
            # Attach the tag template to the BigQuery table.
            self.attach_tag_to_table(table_entry)

        else:
            self.create_entry(self.entry_group_name)
