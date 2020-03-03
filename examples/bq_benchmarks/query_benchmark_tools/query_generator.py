import logging

from generic_benchmark_tools import table_util

SELECT_ALL_ID = 'SIMPLE_SELECT_*'
SELECT_ONE_STRING_ID = 'SELECT_ONE_STRING'
SELECT_50_PERCENT_ID = 'SELECT_50_PERCENT'


class QueryGenerator:

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
        self.get_select_all_query()
        self.get_select_one_string_query()
        self.get_50_percent_query()
        return self.query_strings

    def get_select_all_query(self):
        self.query_strings[SELECT_ALL_ID] = 'SELECT * FROM `{0:s}`'

    def get_select_one_string_query(self):
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
