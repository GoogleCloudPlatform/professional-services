# Copyright 2024 Google LLC
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
"""Processes input data to fit to DLP inspection standards."""

import dataclasses
from enum import Enum
from typing import List, Tuple, Dict

from google.api_core.exceptions import NotFound
from google.cloud import bigquery, dlp_v2
from google.cloud.sql.connector import Connector
from sqlalchemy import create_engine, MetaData, Table, func, select, inspect


@dataclasses.dataclass
class Bigquery:
    """Represents a connection to a Google BigQuery dataset and table."""
    bq_client: bigquery.Client
    dataset: str
    table: str


@dataclasses.dataclass
class CloudSQL:
    """Represents a connection to a Google CloudSQL."""
    connector: Connector
    connection_name: str
    service_account: str
    db_name: str
    table: str
    driver: str
    connection_type: str


class Database(Enum):
    """Represents available sources for database connections."""
    BIGQUERY = "bigquery"
    CLOUDSQL = "cloudsql"


class Preprocessing:
    """Converts input data into Data Loss Prevention tables."""

    def __init__(
            self,
            source: str,
            project: str,
            zone: str,
            **preprocess_args
    ):
        """Initializes `Preprocessing` class with arguments.

        Args:
            source (str): The name of the source of data used.
            project (str): The name of the Google Cloud Platform project.
            zone (str): The name of the zone.
            **preprocess_args: Additional arguments for preprocessing.
                Supported arguments are:
                - bigquery_args(Dict):
                    - dataset (str): The name of the BigQuery dataset.
                    - table (str, optional): The name of the BigQuery table.
                      If not provided, the entire dataset is scanned.
                      Optional. Defaults to None.
                - cloudsql_args(Dict):
                    - instance (str): Name of the database instance.
                    - service_account(str): Service account email to be used.
                    - db_name(str): The name of the database.
                    - table (str): The name of the table.
                    - db_type(str): The type of the database.
                        e.g. postgres, mysql.
        """
        self.source = Database(source)
        self.project = project
        self.zone = zone
        if self.source == Database.BIGQUERY:
            # Handle BigQuery source.
            bigquery_args = preprocess_args.get("bigquery_args", {})
            self.bigquery = Bigquery(bigquery.Client(project=project),
                                     bigquery_args["dataset"],
                                     bigquery_args["table"])
        elif self.source == Database.CLOUDSQL:
            # Handle Cloud SQL source.
            cloudsql_args = preprocess_args.get("cloudsql_args", {})
            instance = cloudsql_args["instance"]
            db_type = cloudsql_args["db_type"]

            # Determine the appropriate database driver and connection
            # name based on db_type.
            if db_type == "mysql":
                driver = "pymysql"
                connection_name = f"mysql+{driver}"
            elif db_type == "postgres":
                driver = "pg8000"
                connection_name = f"postgresql+{driver}"

            self.cloudsql = CloudSQL(
                Connector(),
                f"{project}:{zone}:{instance}",
                cloudsql_args["service_account"],
                cloudsql_args["db_name"],
                cloudsql_args["table"],
                driver,
                connection_name)

    def get_connection(self):
        """Returns a connection to the database.

        Returns:
            A connection object that can be used to execute queries.
        """
        connector = self.cloudsql.connector.connect(
            self.cloudsql.connection_name,
            self.cloudsql.driver,
            enable_iam_auth=True,
            user=self.cloudsql.service_account,
            db=self.cloudsql.db_name
        )
        return connector

    def get_cloudsql_tables(self):
        """Returns a list of all tables in the CloudSQL database.

        Returns:
            A list of table names.
        """
        # Create a database engine instance.
        engine = create_engine(
            f'{self.cloudsql.connection_type}://', creator=self.get_connection)

        table_names = inspect(engine).get_table_names()

        return table_names

    def get_cloudsql_data(
            self,
            table: str,
            batch_size: int,
            start_index: int
    ) -> Tuple[List, List]:
        """Retrieves the schema and content of a table from CloudSQL.

        Args:
            table (str): The name of the table.
            batch_size (int): The block of cells to be analyzed.
            start_index (int): The starting index of each block to be analyzed.

        Returns:
            Tuple(List, List): A tuple containing the schema and content
            as a List.
        """
       # Create a database engine instance.
        engine = create_engine(
            f'{self.cloudsql.connection_type}://', creator=self.get_connection)

        # Create a Metadata and Table instance.
        metadata = MetaData()
        table = Table(table, metadata, extend_existing=True,
                      autoload_with=engine)

        num_columns = len(table.columns.keys())

        # Get table schema.
        schema = [column.name for column in table.columns]

        # Get table contents.
        with engine.connect() as connection:
            query = table.select().with_only_columns(table.columns) \
                .limit(int(batch_size/num_columns)) \
                    .offset(int(start_index/num_columns))
            content = list(connection.execute(query).fetchall())

        return schema, content

    def get_bigquery_tables(self, dataset: str) -> List[str]:
        """Constructs a list of table names from a BigQuery dataset.

        Args:
            Dataset (str): Name of the dataset in BigQuery.

        Returns:
            List of tablenames.
        """
        dataset_tables = list(self.bigquery.bq_client.list_tables(dataset))
        table_names = [table.table_id for table in dataset_tables]
        return table_names

    def fetch_rows(
        self,
        table_bq: bigquery.table.Table,
        start_index: int,
        batch_size: int
    ) -> List[Dict]:
        """Fetches a batch of rows from a BigQuery table.

           Args:
              table_bq (bigquery.table.Table) : The path of the table
                where the data is fetched.
              start_index (int) : The starting index of each block to
              be analyzed.
              batch_size (int) : The block of cells to be analyzed.

           Returns:
              List[Dict]: A list of rows, where each row is a tuple
              containing the values for each field in the table schema.
         """
        content = []

        num_columns = len(table_bq.schema)

        rows_iter = self.bigquery.bq_client.list_rows(
            table=table_bq,start_index=int(start_index/num_columns),
            max_results=int(batch_size/num_columns))

        if not rows_iter.total_rows:
            print(f"""The Table {table_bq.table_id} is empty. Please populate
                  the table and try again.""")
        else:
            for row in rows_iter:
                content.append(tuple(row))

        return content

    def get_table_schema(self, table_id: str) -> Tuple[List, List, List]:
        """Generates a schema for a given table ID.

            Args:
                table_id (str): The ID of the table for which the schema needs
                to be generated.

            Returns:
                tuple: A tuple containing three lists - schema, nested_columns,
                and record_columns.
                - schema (list): The list of fields in the schema.
                - nested_columns (list): A list with the columns of the
                    nested columns.
                - record_columns (list): The columns with the record type.
            """
        schema = []
        nested_columns = []
        record_columns = []
        fields = table_id.schema
        for field in fields:
            record, nested, main_field = self.get_field(field)
            if nested:
                record_columns.append(main_field)
                nested_columns.append(record)
            else:
                schema.append(record)

        return schema, nested_columns, record_columns

    def get_field(self, field):
        """Generates a field for the given field object.

        Args:
            field: The field object for which the field needs to be generated.

        Returns:
            tuple: A tuple containing three values - record, nested, and
            main_cell.
            - record: The generated field or list of nested fields.
            - nested (bool): Indicates if the field is nested or not.
            - main_cell: The main field associated with the nested fields.
        """
        # Checks if the field has nested columns.
        if field.field_type == "RECORD":
            field_names = []
            for subfield in field.fields:
                main_cell = field.name
                cell = f"{field.name}.{subfield.name}"
                # Checks if the field has nested fields within.
                if subfield.field_type == "RECORD":
                    field_names.append(self.get_field(subfield))
                else:
                    field_names.append(cell)
            return field_names, True, main_cell
        return field.name, False, False

    def get_query(
            self,
            table_bq: bigquery.table.Table,
            query_args: Dict) -> str:
        """Creates a SQL query as a string.

        Args:
            table_bq (bigquery.table.Table): The fully qualified name
            of the BigQuery table.
            query_args (Dict) :
                columns_selected (str): The string with the selected columns.
                unnest (str): The unnest string for the query.
                limit (int): The maximum number of rows to
                retrieve in each block.
                offset(int): The starting index of the rows to retrieve.

        Returns:
            str: SQL query as a string.
        """
        query = f"""SELECT {query_args['columns_selected']}
                    FROM `{table_bq}`,
                    {query_args['unnest']} LIMIT {query_args['limit']} 
                    OFFSET {query_args['offset']}"""
        return query

    def get_nested_types(self, table_bq: bigquery.table.Table) -> List[str]:
        """ Gets the field modes of the selected table.

        Args:
            table_bq (bigquery.table.Table): The fully qualified
            name of the BigQuery table.

        Returns:
            List: A complete list with the field modes of the columns.
        """
        nested_types = [field.mode for field in table_bq.schema]
        return nested_types

    def get_rows_query(
        self,
        nested_args: Dict,
        table_bq: bigquery.table.Table,
        batch_size: int,
        start_index: int
    ) -> List[Dict]:
        """Retrieves the content of the table.

        Args:
            nested_args (Dict):
                table_schema (List[Dict]): The schema of a BigQuery table.
                nested_columns (List[Dict]): A list with the columns
                of the nested columns.
                record_columns (List[Dict]): The columns with the record type.
            table_bq (bigquery.table.Table): The fully qualified name
            of the BigQuery table.
            batch_size (int): The block of cells to be analyzed.
            start_index (int): The starting index of each block to be analyzed.

        Returns:
            List[Dict]: The content of the BigQuery table.
        """
        nested_types = self.get_nested_types(table_bq)

        if "REPEATED" in nested_types:
            bq_schema = nested_args["table_schema"] \
                + nested_args["record_columns"]
            num_columns = len(bq_schema)
            columns_selected = ", ".join(str(column) for column in bq_schema)
            unnest = f"UNNEST ({nested_args['record_columns'][0]})"
        else:
            bq_schema = nested_args["table_schema"] \
                + nested_args["nested_columns"]
            num_columns = len(bq_schema)
            columns_selected = ", ".join(str(column) for column in bq_schema)
            unnest = (
                f"""UNNEST ([{nested_args['record_columns'][0]}])
                as {nested_args['record_columns'][0]} """
            )
        # Generate the SQL query using the selected columns,
        # table, unnest, limit, and offset. Calculate the limit and offset for
        # the SQL query based on the block size.
        sql_query = self.get_query(
            table_bq,
            {
                "columns_selected": columns_selected,
                "unnest": unnest,
                "offset": int(start_index/num_columns),
                "limit": int(batch_size/num_columns)
            })

        query_job = self.bigquery.bq_client.query(sql_query)
        query_results = query_job.result()
        bq_rows_content = [tuple(dict(row).values()) for row in query_results]

        return bq_rows_content

    def get_data_types(self, table_id: str) -> List:
        """ Gets the data types of the selected table.

        Args:
            table_id (str): The fully qualified name of the BigQuery table.

        Returns:
            List: A complete list with the data types of the columns.
        """
        return [field.field_type for field in table_id.schema]

    def flatten_list(self, unflattened_list: List) -> List:
        """
        Recursively flattens a nested list and returns a flattened list.

        Args:
            list (list): The input list that needs to be flattened.

        Returns:
            list: The flattened list.
        """
        # Create an empty list to store the flattened elements.
        flattened = []

        # Iterate through each element in the list.
        for element in unflattened_list:
            # If the element is a list, recursively flatten the list.
            if isinstance(element, list):
                flattened.extend(self.flatten_list(element))
            else:
                # If the element is not a list, add it to the flattened list.
                flattened.append(element)

        # Return the flattened list.
        return flattened

    def get_bigquery_data(
        self,
        table_id: str,
        start_index: int,
        batch_size: int
    ) -> Tuple[List[Dict], List[Dict]]:
        """Retrieves the schema and content of a BigQuery table.

        Args:
            table_id (str): The fully qualified name of the BigQuery table.
            star_index (int): The starting index of each block to be analyzed.
            batch_size (int): The block of cells to be analyzed.

        Returns:
            Tuple[List[Dict], List[Dict]]: A tuple containing the BigQuery
            schema and content as a List of Dictionaries.
        """
        try:
            table_bq = self.bigquery.bq_client.get_table(table_id)
        except NotFound as exc:
            raise ValueError(f"Error retrieving table {table_id}.") from exc

        dtypes = self.get_data_types(table_bq)

        # Checks if there are nested fields in the schema.
        if "RECORD" in dtypes:
            table_schema, nested_columns, record_columns = (
                self.get_table_schema(table_bq))
            table_schema = self.flatten_list(table_schema)
            nested_columns = self.flatten_list(nested_columns)
            bq_schema = table_schema + nested_columns
            bq_rows_content = self.get_rows_query(
                {
                    "table_schema": table_schema,
                    "nested_columns": nested_columns,
                    "record_columns": record_columns
                },
                table_bq,
                batch_size,
                start_index)
        else:
            table_schema = table_bq.schema
            bq_schema = [field.to_api_repr()["name"] for field in table_schema]
            bq_rows_content = self.fetch_rows(
                table_bq, start_index, batch_size)

        return bq_schema, bq_rows_content

    def convert_to_dlp_table(self, schema: List[Dict],
                             content: List[Dict]) -> dlp_v2.Table:
        """Converts a BigQuery table into a DLP table.

        Converts a BigQuery table into a Data Loss Prevention table,
        an object that can be inspected by Data Loss Prevention.

        Args:
            schema (List[Dict]): The schema of a BigQuery table.
            content (List[Dict]): The content of a BigQuery table.

        Returns:
            A table object that can be inspected by Data Loss Prevention.
        """
        table_dlp = dlp_v2.Table()
        table_dlp.headers = [
            {"name": schema_object} for schema_object in schema
        ]

        rows = []
        for row in content:
            rows.append(dlp_v2.Table.Row(
                values=[dlp_v2.Value(
                    string_value=str(cell_val)) for cell_val in row]))

        table_dlp.rows = rows

        return table_dlp

    def get_tables_info(self) -> List[Tuple]:
        """Retrieves information about tables in a dataset from
        BigQuery or CloudSQL.
        This function is used to retrieve information necessary
        for running the program with dataflow, as it enables subsequent
        table fragmentation for parallelization.

        Returns:
            List[Tuple]: A list of tuples containing the table name
            and the total number of cells.
        """

        # Retrieve table names from either a specific table
        # or all tables in a dataset.
        if self.source == Database.BIGQUERY:
            table_names = [self.bigquery.table] if self.bigquery.table \
                else self.get_bigquery_tables(self.bigquery.dataset)
        elif self.source == Database.CLOUDSQL:
            table_names = [self.cloudsql.table] if self.cloudsql.table \
                else self.get_cloudsql_tables()

        tables = []

        if self.source == Database.BIGQUERY:

            for table_name in table_names:
                # Get the table object from BigQuery.
                table_bq = self.bigquery.bq_client.get_table(
                    f"{self.bigquery.dataset}.{table_name}")

                # Calculate the total number of rows and columns in the table.
                num_rows = table_bq.num_rows

                dtypes = self.get_data_types(table_bq)

                # Checks if there are nested fields in the schema.
                if "RECORD" in dtypes:
                    table_schema, _, record_columns = (
                        self.get_table_schema(table_bq))
                    num_columns = len(table_schema + record_columns)
                else:
                    num_columns = len(table_bq.schema)

                # Append a tuple with the table name and the total number
                # of cells to the list.
                tables.append((table_name,num_rows*num_columns))

        elif self.source == Database.CLOUDSQL:
             # Create a database engine instance.
            engine = create_engine(
                f'{self.cloudsql.connection_type}://',
                creator=self.get_connection
                )

            for table_name in table_names:
                # Create a Metadata and Table instance.
                metadata = MetaData()
                table = Table(table_name, metadata, extend_existing=True,
                            autoload_with=engine)

                num_columns = len(table.columns.keys())

                # Get table contents.
                with engine.connect() as connection:
                    count_query = select(
                        # pylint: disable=E1102
                        func.count("*")).select_from(table)
                    num_rows = connection.execute(count_query).scalar()
                    tables.append((table_name,num_rows*num_columns))

        return tables

    def get_dlp_table_per_block(
            self,
            batch_size: int,
            table_name: str,
            start_index: int
        ) -> dlp_v2.Table:
        """Constructs a DLP Table object, a partir de cada bloque de celdas.
        Args:
            batch_size (int): The block of cells to be analyzed.
            table_name (str): The name of the table to be analyzed.
            start_index (int): The starting index of each block to be analyzed.

        Returns:
            A Data Loss Prevention table object.
        """
        if self.source == Database.BIGQUERY:
            schema, content = self.get_bigquery_data(
                f"{self.bigquery.dataset}.{table_name}",
                start_index,
                batch_size
            )

        elif self.source == Database.CLOUDSQL:
            schema, content = self.get_cloudsql_data(
                table_name,
                batch_size,
                start_index
            )

        return self.convert_to_dlp_table(schema, content)
