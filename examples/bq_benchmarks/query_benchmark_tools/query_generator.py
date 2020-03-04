import logging

from generic_benchmark_tools import table_util

SELECT_ALL_ID = 'SIMPLE_SELECT_*'
SELECT_ONE_STRING_ID = 'SELECT_ONE_STRING'
SELECT_50_PERCENT_ID = 'SELECT_50_PERCENT'


class QueryGenerator:
    """Holds methods used to generate queries to be run on a specific table.

    Attributes:
        table_id(str): ID of the table the query will be run on.
        dataset_id(str): ID of the dataset that holds the table the query will
            be run on.
        bq_table_util(generic_benchmark_tools.table_util.TableUtil): Util to
            help hand the table and its properties.
        schema(List[google.cloud.bigquery.schema.SchemaField]): Schema of the
            table.
        query_strings(dict): Dictionary where query types are keys and the query
            strings are values.

    """

    def __init__(self, table_id, dataset_id):
        self.table_id = table_id
        self.dataset_id = dataset_id
        self.bq_table_util = table_util.TableUtil(
            self.table_id,
            self.dataset_id
        )
        self.bq_table_util.set_table_properties()
        self.schema = self.bq_table_util.table.schema
        self.query_strings = {}

    def get_query_strings(self):
        """Gets query strings for each type of query.

        Returns:
            A dictionary where query types are keys and the query
            strings are values.

        """
        self.get_select_all_query()
        self.get_select_one_string_query()
        self.get_50_percent_query()
        return self.query_strings

    def get_select_all_query(self):
        """Generates a select * query."""
        self.query_strings[SELECT_ALL_ID] = 'SELECT * FROM `{0:s}`'

    def get_select_one_string_query(self):
        """Generates a query that selects the first string in the schema."""
        string_field_name = None
        for field in self.schema:
            if field.field_type == 'STRING':
                string_field_name = field.name
                break
        if not string_field_name:
            logging.info('No string fields were found in the schema for BQ '
                         'table {0:s}.Unable to run {1:s} query.'.format(
                            self.table_id,
                            SELECT_ONE_STRING_ID
                         ))
        else:
            query = 'SELECT {0:s} from `{1:s}`'.format(
                string_field_name,
                '{0:s}'
            )
            self.query_strings[SELECT_ONE_STRING_ID] = query

    def get_50_percent_query(self):
        """Generates a query that selects 50% of the table's fields. """
        num_columns = self.bq_table_util.num_columns
        field_names = []
        for i in range(0, num_columns//2):
            field_names.append(self.schema[i].name)
        fields_strings = ', '.join(field_names)
        query = 'SELECT {0:s} from `{1:s}`'.format(
            fields_strings,
            '{0:s}'
        )
        self.query_strings[SELECT_50_PERCENT_ID] = query
